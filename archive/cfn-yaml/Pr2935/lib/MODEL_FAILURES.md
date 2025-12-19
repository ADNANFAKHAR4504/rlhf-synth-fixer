# Fixes Implemented in SecureEnv.yml

This document highlights the fixes applied to the CloudFormation `TapStack.yml` file, detailing the differences between the original and updated implementations.

## **1. Replaced Hardcoded AMI with SSM Parameter**
- **Before**: EC2 instances in YAML 1 used a hardcoded AMI ID (`ami-0c2d3e23fd0c31a77`), reducing portability across regions and risking obsolescence.
- **After**: YAML 2 uses an SSM Parameter to dynamically retrieve the latest Amazon Linux 2 AMI, improving portability and maintainability.

**Implemented Fix:**
```yaml
Parameters:
  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
    Description: 'SSM parameter for latest Amazon Linux 2 AMI'

# Inside EC2 Instances
Resources:
  SecureEnvWebServer1:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      # other properties...

  SecureEnvWebServer2:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      # other properties...
```

## **2. Restricted Security Group Ingress and Added Egress Rules**
- **Before**: In YAML 1, the ALB security group allowed HTTP/HTTPS traffic from `0.0.0.0/0` without parameterization, and the web server security group restricted HTTP/HTTPS to the ALB security group, which is overly restrictive and bypasses direct access. No egress rules were defined, implying unrestricted outbound traffic (`IpProtocol: -1`).
- **After**: YAML 2 introduces parameters `AllowedIPRange` and `AllowedSSHCIDR` to control HTTP/HTTPS and SSH ingress for both ALB and web server security groups, enhancing flexibility and security. Explicit egress rules were added to the web server security group, though still allowing all outbound traffic.

**Implemented Fix:**
```yaml
Parameters:
  AllowedIPRange:
    Type: String
    Default: '0.0.0.0/0'
    Description: 'CIDR range allowed for HTTP/HTTPS access'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'
  AllowedSSHCIDR:
    Type: String
    Default: '0.0.0.0/0'
    Description: 'CIDR block allowed for SSH access'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'

Resources:
  SecureEnvWebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref SecureEnvVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHCIDR
          Description: 'SSH access from specified CIDR'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedIPRange
          Description: 'HTTP from specified CIDR'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedIPRange
          Description: 'HTTPS from specified CIDR'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'

  SecureEnvALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref SecureEnvVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedIPRange
          Description: 'HTTP from specified CIDR'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedIPRange
          Description: 'HTTPS from specified CIDR'
```

## **3. Added Deletion Policies to Resources**
- **Before**: YAML 1 lacked `DeletionPolicy` and `UpdateReplacePolicy` for most resources except the RDS instance (which had `DeletionPolicy: Snapshot`), risking unintended data loss or behavior during stack updates or deletion.
- **After**: YAML 2 explicitly adds `DeletionPolicy: Delete` and `UpdateReplacePolicy: Delete` to S3 buckets, RDS instance, and other resources, ensuring predictable behavior during stack operations.

**Implemented Fix:**
```yaml
Resources:
  SecureEnvCloudTrailBucket:
    Type: AWS::S3::Bucket
    UpdateReplacePolicy: Delete
    DeletionPolicy: Delete
    Properties:
      # bucket properties...

  SecureEnvApplicationBucket:
    Type: AWS::S3::Bucket
    UpdateReplacePolicy: Delete
    DeletionPolicy: Delete
    Properties:
      # bucket properties...

  SecureEnvAccessLogsBucket:
    Type: AWS::S3::Bucket
    UpdateReplacePolicy: Delete
    DeletionPolicy: Delete
    Properties:
      # bucket properties...

  SecureEnvDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      # database properties...
```

## **4. Added Lifecycle Policies to S3 Buckets**
- **Before**: YAML 1's S3 buckets (`SecureEnvCloudTrailBucket`, `SecureEnvApplicationBucket`, `SecureEnvAccessLogsBucket`) lacked lifecycle policies, leading to potential cost increases from accumulating data.
- **After**: YAML 2 introduces lifecycle policies for S3 buckets to transition objects to cheaper storage classes (STANDARD_IA, GLACIER) and set expiration periods, optimizing costs.

**Implemented Fix:**
```yaml
Resources:
  SecureEnvCloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-cloudtrail-${AWS::AccountId}-${AWS::Region}'
      LifecycleConfiguration:
        Rules:
          - Id: cloudtrail-logs-transition
            Status: Enabled
            ExpirationInDays: 2555
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
      # other properties...

  SecureEnvApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-application-${AWS::AccountId}-${AWS::Region}'
      LifecycleConfiguration:
        Rules:
          - Id: app-objects
            Status: Enabled
            ExpirationInDays: 3650
      # other properties...

  SecureEnvAccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-access-logs-${AWS::AccountId}-${AWS::Region}'
      LifecycleConfiguration:
        Rules:
          - Id: access-logs-transition
            Status: Enabled
            ExpirationInDays: 2555
            Transitions:
              - TransitionInDays: 30
                StorageClass: STANDARD_IA
              - TransitionInDays: 90
                StorageClass: GLACIER
      # other properties...
```

## **5. Enhanced Parameterization and Naming Consistency**
- **Before**: YAML 1 used multiple parameters (`SecureEnvInstanceType`, `SecureEnvSSHAccessCIDR`, `SecureEnvDBInstanceClass`, `SecureEnvProjectName`, `SecureEnvEnvironment`) with a `SecureEnv` prefix, and resource names were inconsistent (e.g., `SecureEnvVPC` vs. `SecureEnvCloudTrailBucket`). The `SecureEnvProjectName` default was `SecureInfrastructure`, and `SecureEnvEnvironment` was `Production`.
- **After**: YAML 2 consolidates naming with a single `ProjectName` parameter (default: `secureenv`), used consistently in resource names (e.g., `${ProjectName}-vpc`). Removed redundant parameters like `SecureEnvEnvironment` and hardcoded `Production` in tags. Added `AllowedIPRange`, `AllowedSSHCIDR`, and `DBUsername` with validation for better control.

**Implemented Fix:**
```yaml
Parameters:
  ProjectName:
    Type: String
    Default: 'secureenv'
    Description: 'Prefix for naming all resources'
  AllowedIPRange:
    Type: String
    Default: '0.0.0.0/0'
    Description: 'CIDR range allowed for HTTP/HTTPS access'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'
  AllowedSSHCIDR:
    Type: String
    Default: '0.0.0.0/0'
    Description: 'CIDR block allowed for SSH access'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'
  DBUsername:
    Type: String
    Default: 'admin'
    NoEcho: true
    Description: 'Database master username'
    MinLength: 1

Resources:
  SecureEnvVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-vpc'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production
      # other properties...
```

## **6. Removed Explicit IAM Role Names for CAPABILITY_IAM Compatibility**
- **Before**: YAML 1 explicitly defined `RoleName` for IAM roles (`SecureEnvEC2Role`, `SecureEnvLambdaRole`, `SecureEnvCloudTrailRole`), requiring `CAPABILITY_NAMED_IAM`, which complicates automation.
- **After**: YAML 2 removes `RoleName` properties, allowing CloudFormation to auto-generate names, reducing the capability requirement to `CAPABILITY_IAM`.

**Implemented Fix:**
```yaml
Resources:
  SecureEnvEC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      # Removed RoleName property
      # other properties...

  SecureEnvLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      # Removed RoleName property
      # other properties...

  SecureEnvCloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      # Removed RoleName property
      # other properties...
```

## **7. Added AWS Config for Compliance Monitoring**
- **Before**: YAML 1 lacked AWS Config resources, missing automated compliance checks for the infrastructure.
- **After**: YAML 2 introduces AWS Config resources, including a configuration recorder, delivery channel, a custom Lambda function to manage the recorder, and a Config rule to check IAM password policy compliance. A new S3 bucket (`SecureEnvConfigBucket`) was added to store Config data.

**Implemented Fix:**
```yaml
Resources:
  SecureEnvConfigRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: !Sub '${ProjectName}-config-policy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetObject
                  - s3:GetBucketAcl
                  - s3:ListBucket
                Resource:
                  - !GetAtt SecureEnvConfigBucket.Arn
                  - !Sub '${SecureEnvConfigBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - config:Put*
                  - config:Get*
                  - config:Describe*
                Resource: '*'

  SecureEnvConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub '${ProjectName}-config-recorder'
      RoleARN: !GetAtt SecureEnvConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  SecureEnvDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      S3BucketName: !Ref SecureEnvConfigBucket

  SecureEnvConfigRuleIAMPasswordPolicy:
    Type: AWS::Config::ConfigRule
    DependsOn: SecureEnvStartConfigRecorder
    Properties:
      ConfigRuleName: !Sub '${ProjectName}-iam-password-policy'
      Description: 'Checks if password policy is compliant'
      Source:
        Owner: AWS
        SourceIdentifier: IAM_PASSWORD_POLICY
```

## **8. Added DynamoDB Table for Application Data**
- **Before**: YAML 1 did not include a DynamoDB table, limiting the template’s ability to support scalable, serverless data storage for applications.
- **After**: YAML 2 adds a DynamoDB table with pay-per-request billing, point-in-time recovery, and server-side encryption, enhancing application scalability. IAM roles for EC2 and Lambda were updated to include DynamoDB permissions.

**Implemented Fix:**
```yaml
Resources:
  SecureEnvDynamoDBTable:
    Type: AWS::DynamoDB::Table
    UpdateReplacePolicy: Delete
    DeletionPolicy: Delete
    Properties:
      TableName: !Sub '${ProjectName}-appdata'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-appdata-table'
        - Key: Project
          Value: !Ref ProjectName
        - Key: Environment
          Value: Production

  SecureEnvEC2Role:
    Type: AWS::IAM::Role
    Properties:
      Policies:
        - PolicyName: !Sub '${ProjectName}-ec2-policy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${ProjectName}-appdata'
```

## **9. Added CloudWatch Agent Installation in EC2 UserData**
- **Before**: YAML 1’s EC2 instances installed Apache (`httpd`) but did not configure the CloudWatch agent, despite the EC2 role including `CloudWatchAgentServerPolicy`.
- **After**: YAML 2 replaces `httpd` with `nginx` and adds CloudWatch agent installation in the UserData script, aligning with the attached IAM policy and enabling log/metric collection.

**Implemented Fix:**
```yaml
Resources:
  SecureEnvWebServer1:
    Type: AWS::EC2::Instance
    Properties:
      UserData:
        Fn::Base64: |
          #!/bin/bash
          yum update -y
          amazon-linux-extras install -y nginx1
          systemctl start nginx
          systemctl enable nginx
          yum install -y amazon-cloudwatch-agent
          systemctl start amazon-cloudwatch-agent
          systemctl enable amazon-cloudwatch-agent
          echo "<h1>SecureEnv Web Server 1</h1>" > /usr/share/nginx/html/index.html
```

## **10. Added CloudTrail Monitoring for Unauthorized Access**
- **Before**: YAML 1’s CloudTrail setup lacked monitoring for unauthorized API calls, missing opportunities to detect security issues.
- **After**: YAML 2 adds a CloudWatch metric filter and alarm to detect unauthorized API calls (`UnauthorizedOperation`, `AccessDenied`), enhancing security monitoring.

**Implemented Fix:**
```yaml
Resources:
  SecureEnvUnauthorizedMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Ref SecureEnvCloudTrailLogGroup
      FilterPattern: '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }'
      MetricTransformations:
        - MetricName: UnauthorizedAPICalls
          MetricNamespace: !Sub '${ProjectName}-metrics'
          MetricValue: '1'

  SecureEnvUnauthorizedAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-unauthorized-calls'
      MetricName: UnauthorizedAPICalls
      Namespace: !Sub '${ProjectName}-metrics'
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching
```

## **11. Added ELB Access Logs Bucket Policy**
- **Before**: YAML 1’s `SecureEnvAccessLogsBucket` lacked a bucket policy to allow ELB access logs, potentially causing log delivery failures.
- **After**: YAML 2 adds a bucket policy for `SecureEnvAccessLogsBucket` to allow ELB to write access logs, using a mapping for region-specific ELB account IDs.

**Implemented Fix:**
```yaml
Mappings:
  ELBAccountIds:
    ap-south-1:
      AccountId: "718504428378"
    us-east-1:
      AccountId: "127311923021"
    us-east-2:
      AccountId: "033677994240"
    us-west-1:
      AccountId: "027434742980"
    us-west-2:
      AccountId: "797873946194"

Resources:
  SecureEnvAccessLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref SecureEnvAccessLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowELBAccessLogs
            Effect: Allow
            Principal:
              AWS: !Sub 
                - "arn:aws:iam::${ELBAccountId}:root"
                - { ELBAccountId: !FindInMap [ELBAccountIds, !Ref "AWS::Region", AccountId] }
            Action: s3:PutObject
            Resource: !Sub "${SecureEnvAccessLogsBucket.Arn}/alb-access-logs/AWSLogs/${AWS::AccountId}/*"
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control
```

## **12. Updated RDS Configuration**
- **Before**: YAML 1 used a hardcoded RDS instance class (`db.t3.micro`), an older MySQL version (`8.0.35`), enabled deletion protection, and used a KMS key for encryption. The `SecureEnvDatabaseSecret` name was not parameterized.
- **After**: YAML 2 removes the KMS key dependency for RDS, updates MySQL to `8.0.43`, disables deletion protection for easier stack management, and parameterizes the database username and secret name for flexibility.

**Implemented Fix:**
```yaml
Parameters:
  DBUsername:
    Type: String
    Default: 'admin'
    NoEcho: true
    Description: 'Database master username'
    MinLength: 1

Resources:
  SecureEnvDatabaseSecret:
    Type: AWS::SecretsManager::Secret
    UpdateReplacePolicy: Delete
    DeletionPolicy: Delete
    Properties:
      Name: !Sub '/${ProjectName}/database/credentials'
      Description: !Sub 'Database credentials for ${ProjectName}'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username":"${DBUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'

  SecureEnvDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-database'
      DBInstanceClass: db.t3.micro
      Engine: mysql
      EngineVersion: '8.0.43'
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${SecureEnvDatabaseSecret}:SecretString:password}}'
      DeletionProtection: false
      # other properties...
```