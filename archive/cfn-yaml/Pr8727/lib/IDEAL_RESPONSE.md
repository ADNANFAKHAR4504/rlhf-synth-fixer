# ideal_response.md

## Overview

The assistant is given a failing CloudFormation template that provisions an Aurora MySQL 8.0 cluster with Database Activity Streams (DAS) enabled via a custom Lambda-backed resource. The stack fails on the `ActivityStreamEnabler` custom resource with a `KMSKeyNotAccessibleFault` error when calling `StartActivityStream`. The root cause is missing IAM permission for the Lambda role to create a grant on the dedicated CMK used by DAS.

The ideal response correctly identifies this as an IAM permissions issue between the Lambda role, KMS, and RDS, and provides a precise, minimal, best-practice fix fully aligned with the existing design.

## What the assistant should do

1. **Root cause analysis**

   * Explicitly explains that `KMSKeyNotAccessibleFault` is caused because the caller (the Lambda using `ActivityStreamLambdaRole`) does not have sufficient permissions on the CMK (`DasKmsKey`) to allow RDS to start the activity stream.
   * Points out that although `DasKmsKey` key policy already trusts the account root and RDS (including the service-linked role), the Lambda role itself must have `kms:CreateGrant` and `kms:DescribeKey` on the CMK.
   * Clarifies that RDS needs to create a grant on the CMK when `StartActivityStream` is called with a customer-managed key, and this requires `kms:CreateGrant` on that key for the caller.

2. **Describe the minimal change**

   * States clearly that the fix should be **limited to updating the inline policy of `ActivityStreamLambdaRole`**.
   * Describes adding `kms:CreateGrant` permission, scoped to the specific CMK ARN (`DasKmsKey`), plus the existing or required `kms:DescribeKey`.
   * Mentions adding a least-privilege condition on `kms:CreateGrant`:

     * `kms:GrantIsForAWSResource` set to `true`.
     * `kms:ViaService` set to `rds.<region>.amazonaws.com` using `!Sub rds.${AWS::Region}.amazonaws.com`.
   * Emphasizes that **no other resources, parameters, or logic** (such as `DasKmsKey`, `DasKmsAlias`, `ActivityStreamLambda`, `ActivityStreamEnabler`, VPC, DB instances, etc.) are changed.

3. **Explain the updated permissions**

   * Clearly lists the effective permission set for `ActivityStreamLambdaRole` as:

     * RDS: `rds:StartActivityStream`, `rds:StopActivityStream`, `rds:DescribeDBClusters` on all RDS resources.
     * KMS: `kms:DescribeKey` on `DasKmsKey`.
     * KMS: `kms:CreateGrant` on `DasKmsKey` with conditions for RDS service usage only.
     * CloudWatch Logs permissions for creating log groups, streams, and putting log events.
   * Explains that this allows the Lambda to:

     * Wait until the CMK is fully ready (via `DescribeKey` in `wait_kms_ready`).
     * Successfully call `StartActivityStream` with `KmsKeyId` set to the CMK ARN, enabling RDS to create the necessary grant.

4. **Preserve existing behavior and best practices**

   * Confirms that:

     * The DAS mode logic (`sync`, `async`, `auto`) in the Lambda function is unchanged.
     * The custom resource still waits for the cluster to become available and for the key to be enabled before calling `StartActivityStream`.
     * KMS key rotation remains enabled and key policy remains as originally configured.
     * The stack continues to use a dedicated CMK for DAS, preserving security and auditability.
   * Highlights that the fix maintains least privilege and does not broaden key access beyond what is required.

5. **Validation and correctness**

   * States that after this change:

     * The `ActivityStreamEnabler` custom resource should reach `CREATE_COMPLETE`.
     * The `KMSKeyNotAccessibleFault` should no longer occur.
     * The rest of the stack (Aurora cluster, instances, autoscaling, alarms, SNS, etc.) remains unchanged and deploys successfully.
   * Mentions that the template should pass CloudFormation validation and linting with no new errors introduced.

6. **Communication style**

   * The response is focused, concrete, and tied directly to the provided template.
   * No extra refactors, no unrelated architectural changes, and no commands or code snippets outside of descriptive text.
   * Uses clear headings and bullet points to describe the change, but avoids tables and executable commands.

```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: >
  TapStack.yml — Dual-mode deployment (AWS + LocalStack).
  AWS mode: Aurora MySQL cluster across 3 AZs with failover, reader autoscaling, alarms, and optional DAS.
  LocalStack mode: Single MySQL DBInstance (Aurora/DAS/autoscaling/alarms disabled automatically).

Metadata:
  TemplateAuthor: TapStack
  Version: v3.2
  Notes:
    - Pure YAML (no anchors/aliases; no flow-style maps/sequences)
    - VPC, subnets, SGs created in-stack (no external params)
    - Best-practice: secrets come from Secrets Manager via dynamic references (no secret params)

Parameters:
  DeploymentTarget:
    Type: String
    Default: aws
    AllowedValues:
      - aws
      - localstack
    Description: >
      Set to 'aws' for real AWS. Set to 'localstack' to disable AWS-only features and use a single MySQL DBInstance.

  EnvironmentSuffix:
    Type: String
    Default: prod-us
    Description: Suffix added to all resource names to avoid collisions.
    AllowedPattern: '^[a-z0-9-]{3,20}$'
    ConstraintDescription: Must be 3–20 characters of lowercase letters, digits, and dashes.

  DatabaseName:
    Type: String
    Default: appdb
    AllowedPattern: '^[A-Za-z0-9_]+$'
    Description: Initial database name.

  DBInstanceClass:
    Type: String
    Default: db.r6g.large
    AllowedPattern: '^[a-z0-9.-]+$'
    Description: Instance class for Aurora instances (AWS mode).

  LocalDbInstanceClass:
    Type: String
    Default: db.t3.micro
    AllowedPattern: '^[a-z0-9.-]+$'
    Description: Instance class for MySQL instance (LocalStack mode).

  DBEngineVersion:
    Type: String
    Default: ''
    AllowedPattern: '^[0-9A-Za-z._-]*$'
    Description: >
      (Optional) Aurora MySQL 8.0 engine version (aurora-mysql 3.x) for AWS mode.
      Leave blank to use default.

  LocalMySqlEngineVersion:
    Type: String
    Default: '8.0'
    AllowedPattern: '^[0-9A-Za-z._-]+$'
    Description: MySQL engine version for LocalStack mode.

  MasterUsername:
    Type: String
    Default: admin
    AllowedPattern: '^[A-Za-z0-9_]+$'
    MinLength: 1
    MaxLength: 16
    Description: Master username.

  MonitoringIntervalSeconds:
    Type: Number
    Default: 10
    AllowedValues:
      - 1
      - 5
      - 10
      - 15
      - 30
      - 60
    Description: Enhanced Monitoring interval in seconds (AWS mode only).

  PerformanceInsightsEnabled:
    Type: String
    AllowedValues:
      - 'true'
      - 'false'
    Default: 'true'
    Description: Enable Performance Insights on instances (AWS mode only).

  PerformanceInsightsRetention:
    Type: Number
    Default: 7
    AllowedValues:
      - 7
      - 731
    Description: Performance Insights retention in days (AWS mode only).

  BackupRetentionDays:
    Type: Number
    Default: 35
    MinValue: 1
    MaxValue: 35
    Description: Automated backup retention in days (AWS mode only).

  PreferredBackupWindowUTC:
    Type: String
    Default: '03:00-04:00'
    AllowedPattern: '^([01][0-9]|2[0-3]):[0-5][0-9]-([01][0-9]|2[0-3]):[0-5][0-9]$'
    Description: Preferred backup window in UTC (AWS mode only).

  KmsKeyId:
    Type: String
    Default: ''
    Description: Optional KMS Key ARN for Aurora storage encryption (AWS mode only).

  SNSNotificationEmail:
    Type: String
    Default: ''
    Description: Optional email to subscribe for alarms/notifications (AWS mode only).

  ActivityStreamEnabled:
    Type: String
    AllowedValues:
      - 'true'
      - 'false'
    Default: 'true'
    Description: Enable Database Activity Streams (AWS mode only; auto-disabled in LocalStack mode).

  ActivityStreamMode:
    Type: String
    AllowedValues:
      - 'sync'
      - 'async'
      - 'auto'
    Default: 'auto'
    Description: DAS mode. 'auto' tries sync then falls back to async if region doesn’t support sync (AWS mode only).

Conditions:
  IsLocalStack: !Equals [!Ref DeploymentTarget, 'localstack']
  IsAws: !Equals [!Ref DeploymentTarget, 'aws']

  UseCustomerKms: !And
    - !Condition IsAws
    - !Not [!Equals [!Ref KmsKeyId, '']]

  CreateEmailSubscription: !And
    - !Condition IsAws
    - !Not [!Equals [!Ref SNSNotificationEmail, '']]

  EnablePI: !And
    - !Condition IsAws
    - !Equals [!Ref PerformanceInsightsEnabled, 'true']

  HasEngineVersion: !And
    - !Condition IsAws
    - !Not [!Equals [!Ref DBEngineVersion, '']]

  EnableActivityStreams: !And
    - !Condition IsAws
    - !Equals [!Ref ActivityStreamEnabled, 'true']

Resources:
  ########################################
  # Networking — VPC & Private Subnets
  ########################################
  Vpc:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.20.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub vpc-${EnvironmentSuffix}

  RouteTablePrivateA:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref Vpc
      Tags:
        - Key: Name
          Value: !Sub rt-private-a-${EnvironmentSuffix}

  RouteTablePrivateB:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref Vpc
      Tags:
        - Key: Name
          Value: !Sub rt-private-b-${EnvironmentSuffix}

  RouteTablePrivateC:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref Vpc
      Tags:
        - Key: Name
          Value: !Sub rt-private-c-${EnvironmentSuffix}

  SubnetPrivateA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.20.10.0/24
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub subnet-private-a-${EnvironmentSuffix}

  SubnetPrivateB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.20.20.0/24
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub subnet-private-b-${EnvironmentSuffix}

  SubnetPrivateC:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: 10.20.30.0/24
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub subnet-private-c-${EnvironmentSuffix}

  SubnetRouteAssocA:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref SubnetPrivateA
      RouteTableId: !Ref RouteTablePrivateA

  SubnetRouteAssocB:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref SubnetPrivateB
      RouteTableId: !Ref RouteTablePrivateB

  SubnetRouteAssocC:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref SubnetPrivateC
      RouteTableId: !Ref RouteTablePrivateC

  ########################################
  # Security Groups
  ########################################
  AppTierSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: !Sub 'App tier SG (${EnvironmentSuffix}) allowed to reach DB'
      VpcId: !Ref Vpc
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 10.20.0.0/16
      Tags:
        - Key: Name
          Value: !Sub app-sg-${EnvironmentSuffix}

  DbSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: !Sub 'DB SG - restrict to app tier only - ${EnvironmentSuffix}'
      VpcId: !Ref Vpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref AppTierSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub db-sg-${EnvironmentSuffix}

  ########################################
  # Subnet Group for RDS
  ########################################
  DbSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: !Sub 'DB Subnet Group - ${EnvironmentSuffix}'
      DBSubnetGroupName: !Sub db-subnet-group-${EnvironmentSuffix}
      SubnetIds:
        - !Ref SubnetPrivateA
        - !Ref SubnetPrivateB
        - !Ref SubnetPrivateC
      Tags:
        - Key: Name
          Value: !Sub db-subnet-group-${EnvironmentSuffix}

  ########################################
  # Parameter Group (AWS/Aurora only)
  ########################################
  ClusterParameterGroup:
    Condition: IsAws
    Type: AWS::RDS::DBClusterParameterGroup
    Properties:
      Description: !Sub 'Cluster parameter group with binary logging enabled - ${EnvironmentSuffix}'
      Family: aurora-mysql8.0
      Parameters:
        binlog_format: ROW
        binlog_row_image: FULL
      Tags:
        - Key: Name
          Value: !Sub aurora-cluster-parameter-group-${EnvironmentSuffix}

  ########################################
  # Enhanced Monitoring Role (AWS only)
  ########################################
  EnhancedMonitoringRole:
    Condition: IsAws
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub enhanced-monitoring-role-${EnvironmentSuffix}
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole
      Tags:
        - Key: Name
          Value: !Sub enhanced-monitoring-role-${EnvironmentSuffix}

  ########################################
  # Secrets Manager (AWS + LocalStack) — dynamic references (best practice)
  ########################################
  MasterSecret:
    Condition: IsAws
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub aurora-master-secret-${EnvironmentSuffix}
      Description: !Sub 'Master password for Aurora cluster ${EnvironmentSuffix}'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username":"${MasterUsername}"}'
        GenerateStringKey: password
        ExcludeCharacters: '"@/\\'
        PasswordLength: 32
      Tags:
        - Key: Name
          Value: !Sub aurora-master-secret-${EnvironmentSuffix}

  LocalMasterSecret:
    Condition: IsLocalStack
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub mysql-local-master-secret-${EnvironmentSuffix}
      Description: !Sub 'Master password for LocalStack MySQL instance ${EnvironmentSuffix}'
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username":"${MasterUsername}"}'
        GenerateStringKey: password
        ExcludeCharacters: '"@/\\'
        PasswordLength: 24
      Tags:
        - Key: Name
          Value: !Sub mysql-local-master-secret-${EnvironmentSuffix}

  ########################################
  # AWS MODE — Aurora Cluster
  ########################################
  AuroraDBCluster:
    Condition: IsAws
    Type: AWS::RDS::DBCluster
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBClusterIdentifier: !Sub aurora-cluster-${EnvironmentSuffix}
      Engine: aurora-mysql
      EngineVersion: !If [HasEngineVersion, !Ref DBEngineVersion, !Ref "AWS::NoValue"]
      DatabaseName: !Ref DatabaseName
      DBSubnetGroupName: !Ref DbSubnetGroup
      VpcSecurityGroupIds:
        - !Ref DbSecurityGroup
      MasterUsername: !Ref MasterUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${MasterSecret}:SecretString:password}}'
      BackupRetentionPeriod: !Ref BackupRetentionDays
      PreferredBackupWindow: !Ref PreferredBackupWindowUTC
      StorageEncrypted: true
      KmsKeyId: !If [UseCustomerKms, !Ref KmsKeyId, !Ref "AWS::NoValue"]
      DeletionProtection: true
      BacktrackWindow: 259200
      DBClusterParameterGroupName: !Ref ClusterParameterGroup
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - audit
        - error
        - general
        - slowquery
      Tags:
        - Key: Name
          Value: !Sub aurora-cluster-${EnvironmentSuffix}

  AuroraWriterInstance:
    Condition: IsAws
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub aurora-writer-instance-${EnvironmentSuffix}
      DBClusterIdentifier: !Ref AuroraDBCluster
      Engine: aurora-mysql
      DBInstanceClass: !Ref DBInstanceClass
      PromotionTier: 0
      AvailabilityZone: !Select [0, !GetAZs '']
      MonitoringInterval: !Ref MonitoringIntervalSeconds
      MonitoringRoleArn: !GetAtt EnhancedMonitoringRole.Arn
      EnablePerformanceInsights: !If [EnablePI, true, false]
      PerformanceInsightsRetentionPeriod: !If [EnablePI, !Ref PerformanceInsightsRetention, !Ref "AWS::NoValue"]
      PubliclyAccessible: false
      AutoMinorVersionUpgrade: true
      Tags:
        - Key: Name
          Value: !Sub aurora-writer-instance-${EnvironmentSuffix}

  AuroraReaderAInstance:
    Condition: IsAws
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub aurora-reader-a-instance-${EnvironmentSuffix}
      DBClusterIdentifier: !Ref AuroraDBCluster
      Engine: aurora-mysql
      DBInstanceClass: !Ref DBInstanceClass
      PromotionTier: 1
      AvailabilityZone: !Select [1, !GetAZs '']
      MonitoringInterval: !Ref MonitoringIntervalSeconds
      MonitoringRoleArn: !GetAtt EnhancedMonitoringRole.Arn
      EnablePerformanceInsights: !If [EnablePI, true, false]
      PerformanceInsightsRetentionPeriod: !If [EnablePI, !Ref PerformanceInsightsRetention, !Ref "AWS::NoValue"]
      PubliclyAccessible: false
      AutoMinorVersionUpgrade: true
      Tags:
        - Key: Name
          Value: !Sub aurora-reader-a-instance-${EnvironmentSuffix}

  AuroraReaderBInstance:
    Condition: IsAws
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub aurora-reader-b-instance-${EnvironmentSuffix}
      DBClusterIdentifier: !Ref AuroraDBCluster
      Engine: aurora-mysql
      DBInstanceClass: !Ref DBInstanceClass
      PromotionTier: 2
      AvailabilityZone: !Select [2, !GetAZs '']
      MonitoringInterval: !Ref MonitoringIntervalSeconds
      MonitoringRoleArn: !GetAtt EnhancedMonitoringRole.Arn
      EnablePerformanceInsights: !If [EnablePI, true, false]
      PerformanceInsightsRetentionPeriod: !If [EnablePI, !Ref PerformanceInsightsRetention, !Ref "AWS::NoValue"]
      PubliclyAccessible: false
      AutoMinorVersionUpgrade: true
      Tags:
        - Key: Name
          Value: !Sub aurora-reader-b-instance-${EnvironmentSuffix}

  ########################################
  # AWS MODE — Application Auto Scaling (Read replicas 2–5 @ 70% CPU)
  ########################################
  AuroraReadReplicaScalableTarget:
    Condition: IsAws
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    DependsOn:
      - AuroraWriterInstance
      - AuroraReaderAInstance
      - AuroraReaderBInstance
    Properties:
      MaxCapacity: 5
      MinCapacity: 2
      ResourceId: !Sub 'cluster:${AuroraDBCluster}'
      ScalableDimension: rds:cluster:ReadReplicaCount
      ServiceNamespace: rds

  AuroraReadReplicaScalingPolicy:
    Condition: IsAws
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: !Sub aurora-autoscaling-scaling-policy-${EnvironmentSuffix}
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref AuroraReadReplicaScalableTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 70
        PredefinedMetricSpecification:
          PredefinedMetricType: RDSReaderAverageCPUUtilization
        ScaleInCooldown: 300
        ScaleOutCooldown: 300

  ########################################
  # AWS MODE — SNS for notifications
  ########################################
  FailoverSnsTopic:
    Condition: IsAws
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub sns-failover-topic-${EnvironmentSuffix}
      Tags:
        - Key: Name
          Value: !Sub sns-failover-topic-${EnvironmentSuffix}

  FailoverSnsSubscription:
    Condition: CreateEmailSubscription
    Type: AWS::SNS::Subscription
    Properties:
      Protocol: email
      TopicArn: !Ref FailoverSnsTopic
      Endpoint: !Ref SNSNotificationEmail

  ########################################
  # AWS MODE — CloudWatch Alarms
  ########################################
  ReplicaLagAlarm:
    Condition: IsAws
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub alarm-replica-lag-${EnvironmentSuffix}
      AlarmDescription: Alarm when Aurora replica lag (max across readers) exceeds 1 second.
      Namespace: AWS/RDS
      MetricName: AuroraReplicaLagMaximum
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref AuroraDBCluster
      Statistic: Maximum
      Period: 60
      EvaluationPeriods: 3
      DatapointsToAlarm: 2
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      Unit: Seconds
      AlarmActions:
        - !Ref FailoverSnsTopic
      OKActions:
        - !Ref FailoverSnsTopic

  WriterCpuAlarm:
    Condition: IsAws
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub alarm-writer-cpu-${EnvironmentSuffix}
      AlarmDescription: Alarm when writer CPU exceeds 80%.
      Namespace: AWS/RDS
      MetricName: CPUUtilization
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref AuroraWriterInstance
      Statistic: Average
      Period: 60
      EvaluationPeriods: 5
      DatapointsToAlarm: 3
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      Unit: Percent
      AlarmActions:
        - !Ref FailoverSnsTopic
      OKActions:
        - !Ref FailoverSnsTopic

  ########################################
  # AWS MODE — DAS (Database Activity Streams) — guarded (NOT created in LocalStack)
  ########################################
  DasKmsKey:
    Condition: EnableActivityStreams
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS CMK for Aurora Database Activity Streams - ${EnvironmentSuffix}'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowAccountRoot
            Effect: Allow
            Principal:
              AWS: !Sub arn:${AWS::Partition}:iam::${AWS::AccountId}:root
            Action: 'kms:*'
            Resource: '*'
          - Sid: AllowRDSServicePrincipalUse
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
              - kms:CreateGrant
            Resource: '*'
            Condition:
              Bool:
                kms:GrantIsForAWSResource: 'true'
              StringEquals:
                kms:ViaService: !Sub rds.${AWS::Region}.amazonaws.com
      Tags:
        - Key: Name
          Value: !Sub das-kms-${EnvironmentSuffix}

  DasKmsAlias:
    Condition: EnableActivityStreams
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub alias/das-${EnvironmentSuffix}
      TargetKeyId: !Ref DasKmsKey

  ActivityStreamLambdaRole:
    Condition: EnableActivityStreams
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub das-custom-role-${EnvironmentSuffix}
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
        - PolicyName: !Sub das-custom-inline-${EnvironmentSuffix}
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - rds:StartActivityStream
                  - rds:StopActivityStream
                  - rds:DescribeDBClusters
                Resource: '*'
              - Effect: Allow
                Action:
                  - kms:DescribeKey
                  - kms:CreateGrant
                Resource: !GetAtt DasKmsKey.Arn
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub das-custom-role-${EnvironmentSuffix}

  ActivityStreamLambda:
    Condition: EnableActivityStreams
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub enable-das-${EnvironmentSuffix}
      Role: !GetAtt ActivityStreamLambdaRole.Arn
      Runtime: python3.12
      Handler: index.handler
      Timeout: 600
      MemorySize: 256
      Code:
        ZipFile: |
          import boto3, json, logging, time, urllib.request, botocore
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          def _respond(url, status, req, data, phys_id, reason=None):
            short_reason = (reason[:512] + '…') if reason and len(reason) > 512 else (reason or "See CloudWatch logs for details.")
            body = {
              "Status": status,
              "Reason": short_reason,
              "PhysicalResourceId": phys_id or "RDSActivityStreamCR",
              "StackId": req["StackId"],
              "RequestId": req["RequestId"],
              "LogicalResourceId": req["LogicalResourceId"],
              "Data": data
            }
            s = json.dumps(body)
            rq = urllib.request.Request(url, data=s.encode("utf-8"), method="PUT",
                                        headers={"content-type": "", "content-length": str(len(s))})
            with urllib.request.urlopen(rq) as resp:
              logger.info("CFN callback status: %s", resp.status)

          def wait_cluster_ready(rds, cluster_id, timeout=900):
            start = time.time()
            while time.time() - start < timeout:
              desc = rds.describe_db_clusters(DBClusterIdentifier=cluster_id)["DBClusters"][0]
              status = desc.get("Status", "")
              as_status = desc.get("ActivityStreamStatus", "stopped")
              logger.info("Cluster %s status=%s, activityStream=%s", cluster_id, status, as_status)
              if status == "available" and as_status not in ("starting", "stopping"):
                return desc
              time.sleep(10)
            raise TimeoutError(f"DB cluster {cluster_id} not ready in {timeout}s")

          def wait_kms_ready(kms, key_arn, timeout=300):
            start = time.time()
            last_err = None
            while time.time() - start < timeout:
              try:
                meta = kms.describe_key(KeyId=key_arn)["KeyMetadata"]
                state = meta.get("KeyState")
                usage = meta.get("KeyUsage")
                logger.info("KMS %s state=%s usage=%s", key_arn, state, usage)
                if state == "Enabled" and usage == "ENCRYPT_DECRYPT" and meta.get("DeletionDate") is None:
                  return True
              except Exception as e:
                last_err = e
                logger.info("KMS not ready yet: %s", e)
              time.sleep(5)
            raise TimeoutError(f"KMS key not ready in {timeout}s: {last_err}")

          def start_with_required_kms(rds, cluster_arn, desired_mode, kms_key):
            args = {
              "ResourceArn": cluster_arn,
              "Mode": desired_mode,
              "KmsKeyId": kms_key,
              "ApplyImmediately": True
            }
            rds.start_activity_stream(**args)

          def handler(event, context):
            logger.info("Event: %s", json.dumps(event))
            req_type = event["RequestType"]
            props = event["ResourceProperties"]
            cluster_arn = props["ClusterArn"]
            cluster_id = props.get("ClusterIdentifier")
            mode_param = str(props.get("Mode", "auto")).lower()
            kms_key = props.get("KmsKeyId") or None

            rds = boto3.client("rds")
            kms = boto3.client("kms")
            phys_id = f"{cluster_arn}/activity-stream"

            try:
              if req_type in ("Create", "Update"):
                wait_kms_ready(kms, kms_key)
                desc = wait_cluster_ready(rds, cluster_id) if cluster_id else {}
                if desc.get("ActivityStreamStatus") == "started":
                  _respond(event["ResponseURL"], "SUCCESS", event,
                          {"ActivityStream": "ALREADY_STARTED",
                           "Mode": desc.get("ActivityStreamMode", ""),
                           "KinesisStreamName": desc.get("ActivityStreamKinesisStreamName", "")},
                          phys_id, reason="Already enabled")
                  return

                desired_mode = "sync" if mode_param in ("sync","auto") else "async"

                try:
                  start_with_required_kms(rds, cluster_arn, desired_mode, kms_key)
                except botocore.exceptions.ClientError as e:
                  msg = str(e)
                  low = msg.lower()

                  # Safety: if some environment doesn't support the API, do not brick the stack.
                  if ("not yet been emulated" in low) or ("not available in your current license plan" in low):
                    _respond(event["ResponseURL"], "SUCCESS", event,
                            {"ActivityStream": "SKIPPED_UNSUPPORTED",
                             "Reason": msg[:300]},
                            phys_id, reason="Activity Streams not supported in this environment")
                    return

                  if "not supported in this region" in low and desired_mode == "sync":
                    start_with_required_kms(rds, cluster_arn, "async", kms_key)
                    desired_mode = "async"
                  else:
                    raise

                time.sleep(10)
                desc2 = rds.describe_db_clusters(DBClusterIdentifier=cluster_id)["DBClusters"][0] if cluster_id else {}
                _respond(event["ResponseURL"], "SUCCESS", event,
                        {"ActivityStream": "STARTED",
                         "Mode": desc2.get("ActivityStreamMode", desired_mode),
                         "KinesisStreamName": desc2.get("ActivityStreamKinesisStreamName", "")},
                        phys_id, reason="Enabled")

              elif req_type == "Delete":
                try:
                  desc = wait_cluster_ready(rds, cluster_id, timeout=300) if cluster_id else {}
                  if desc.get("ActivityStreamStatus") == "started":
                    rds.stop_activity_stream(ResourceArn=cluster_arn, ApplyImmediately=True)
                except Exception as e:
                  logger.warning("StopActivityStream warning: %s", e)
                _respond(event["ResponseURL"], "SUCCESS", event,
                        {"ActivityStream": "STOPPED_OR_NOT_ENABLED"}, phys_id, reason="Deleted")

            except Exception as e:
              logger.exception("DAS operation failed")
              _respond(event["ResponseURL"], "FAILED", event, {"Error": str(e)}, phys_id, reason=str(e))

  ActivityStreamEnabler:
    Condition: EnableActivityStreams
    Type: Custom::RDSActivityStream
    DependsOn:
      - DasKmsAlias
      - AuroraWriterInstance
      - AuroraReaderAInstance
      - AuroraReaderBInstance
    Properties:
      ServiceToken: !GetAtt ActivityStreamLambda.Arn
      ClusterArn: !Sub arn:${AWS::Partition}:rds:${AWS::Region}:${AWS::AccountId}:cluster:aurora-cluster-${EnvironmentSuffix}
      ClusterIdentifier: !Ref AuroraDBCluster
      Mode: !Ref ActivityStreamMode
      KmsKeyId: !GetAtt DasKmsKey.Arn

  ########################################
  # LOCALSTACK MODE — Single MySQL instance (Aurora/DAS/autoscaling/alarms skipped)
  ########################################
  LocalMysqlInstance:
    Condition: IsLocalStack
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub mysql-local-${EnvironmentSuffix}
      Engine: mysql
      EngineVersion: !Ref LocalMySqlEngineVersion
      DBName: !Ref DatabaseName
      DBInstanceClass: !Ref LocalDbInstanceClass
      AllocatedStorage: 20
      StorageType: gp2
      PubliclyAccessible: false
      DBSubnetGroupName: !Ref DbSubnetGroup
      VPCSecurityGroups:
        - !Ref DbSecurityGroup
      MasterUsername: !Ref MasterUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${LocalMasterSecret}:SecretString:password}}'
      AutoMinorVersionUpgrade: true
      MultiAZ: false
      Tags:
        - Key: Name
          Value: !Sub mysql-local-${EnvironmentSuffix}

Outputs:
  ClusterEndpoint:
    Condition: IsAws
    Description: Writer endpoint of the Aurora cluster.
    Value: !GetAtt AuroraDBCluster.Endpoint.Address
    Export:
      Name: !Sub cluster-endpoint-${EnvironmentSuffix}

  ReaderEndpoint:
    Condition: IsAws
    Description: Reader endpoint of the Aurora cluster.
    Value: !GetAtt AuroraDBCluster.ReadEndpoint.Address
    Export:
      Name: !Sub reader-endpoint-${EnvironmentSuffix}

  LocalDbEndpoint:
    Condition: IsLocalStack
    Description: Endpoint address of the LocalStack MySQL DB instance.
    Value: !GetAtt LocalMysqlInstance.Endpoint.Address
    Export:
      Name: !Sub localdb-endpoint-${EnvironmentSuffix}

  LocalDbPort:
    Condition: IsLocalStack
    Description: Endpoint port of the LocalStack MySQL DB instance.
    Value: !GetAtt LocalMysqlInstance.Endpoint.Port
    Export:
      Name: !Sub localdb-port-${EnvironmentSuffix}

  KinesisStreamArn:
    Condition: EnableActivityStreams
    Description: ARN of the Kinesis stream receiving Database Activity Streams.
    Value: !Sub >
      arn:${AWS::Partition}:kinesis:${AWS::Region}:${AWS::AccountId}:stream/${ActivityStreamEnabler.KinesisStreamName}
    Export:
      Name: !Sub kinesis-das-stream-arn-${EnvironmentSuffix}

  AppTierSecurityGroupId:
    Description: Security Group ID applications should use to reach the DB (3306).
    Value: !Ref AppTierSecurityGroup
    Export:
      Name: !Sub app-sg-${EnvironmentSuffix}
```