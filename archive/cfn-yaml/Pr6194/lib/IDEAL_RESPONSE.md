# ideal_response.md

## Functional scope (build everything new):

* Provision a production-grade Aurora MySQL cluster in **us-east-1** spanning **three private subnets (AZ a/b/c)** with one writer and two readers using **db.r5.2xlarge**.
* Enforce **environment-safe naming** by suffixing all logical names and tags with **`EnvironmentSuffix`**; restrict the suffix via a **safe kebab-case regex** (no hardcoded AllowedValues).
* Create fresh **VPC primitives** required for database isolation (VPC, three private subnets, private route table associations) plus **interface VPC endpoints** for Secrets Manager and CloudWatch Logs to support rotation in private networks.
* Configure **DB cluster and instance parameter groups** tuned for high-throughput OLTP:

  * `max_connections = 16000` at the **instance** level.
  * `innodb_buffer_pool_size` handled by **Aurora auto-sizing** (documented as design decision).
  * **Disable legacy query cache** at the **cluster** level with `query_cache_size = 0` for Aurora MySQL 5.7 compatibility (reasoned change from user ask).
* Enable **Aurora Backtrack** with **72 hours** retention and **automated backups** with **7 days** retention.
* Enable **Performance Insights** on all instances with **7-day** retention.
* Implement **five CloudWatch alarms** with proactive thresholds:

  * CPUUtilization > 80% (writer).
  * DatabaseConnections > 14,000 (writer).
  * ReadLatency > 200 ms (writer).
  * WriteLatency > 200 ms (writer).
  * AuroraReplicaLagMaximum > 1 second (cluster).
* Create **SNS topic** for alarms with **email subscription** for operational alerting.
* Store **master password in Secrets Manager** with **30-day hosted rotation**; use the **Secrets Manager transform** and provide a **collision-proof secret name** that remains valid even when an older secret is pending deletion.
* Expose **Aurora reader endpoint** for load-spread read traffic and export key **Outputs** for integration.
* Set **DeletionPolicy/UpdateReplacePolicy = Snapshot** on stateful resources to support **blue/green** and minimize data-loss risk during updates.
* Attach **cost-allocation tags**: `Environment=Production`, `Team=Platform`, `Service=Trading`.

## Deliverable:

* A single, production-ready **`TapStack.yml`** that:

  * Declares all **Parameters** with sensible **Defaults** (e.g., `EnvironmentSuffix=prod-us`, `AlarmEmail` placeholder), strict **regex constraints**, and no hardcoded environment enumerations.
  * Builds **every required module** (VPC, subnets, security groups, DB subnet group, KMS key & alias, Secrets, rotation, parameter groups, Aurora cluster & instances, endpoints, alarms, SNS).
  * Uses **`!Ref`** and **`!GetAtt`** consistently to wire dependencies.
  * Uses **`Transform: AWS::SecretsManager-2024-09-16`** to enable hosted rotation and supports deployment with **`CAPABILITY_AUTO_EXPAND`** and **`CAPABILITY_NAMED_IAM`**.
  * Names the secret with a **stack-unique suffix** derived from the **StackId GUID tail** to avoid collisions with secrets pending deletion while complying with Secrets Manager’s naming rules.
  * Emits **Outputs** for cluster identifiers, writer/reader endpoints, alarm ARNs, VPC/SG/Subnet Group references, and secret/rotation ARNs.

## Design decisions & rationale:

* **Query cache** is disabled on Aurora MySQL 5.7; keeping `query_cache_size=0` avoids parameter validation failures while meeting the intent (read path optimized by Aurora).
* **`innodb_buffer_pool_size`** is **not hard-set**; Aurora auto-sizes this optimally for the instance class, preventing engine-level rejections and unnecessary restarts.
* **Max connections** configured at the **instance parameter group** aligns with Aurora modifiability and supports the stated concurrency.
* **Hosted rotation** (Secrets Manager transform) avoids custom Lambda packaging, reduces operational overhead, and keeps rotation inside private subnets through **interface endpoints**.
* **Snapshot policies** on cluster/instances ensure **zero-data-loss rollback** potential and safer blue/green patterns.
* **Reader endpoint** centralizes read-distribution without client-side topology logic.

## Success criteria:

* Stack synthesizes and passes static validation (including cfn-lint) without warnings that block CI.
* Change set creation succeeds with **`CAPABILITY_NAMED_IAM`** and **`CAPABILITY_AUTO_EXPAND`**.
* All five alarms transition to `OK` post-deploy and notify via SNS upon threshold breach (email subscription confirmed).
* Writer and readers report **Performance Insights** data with 7-day retention.
* Application traffic can cut over to writer endpoint with read traffic on the **reader endpoint**, reducing timeout risk during peak trading hours.

## Risks & mitigations:

* **Secret name conflicts** when a prior secret is pending deletion → mitigated by **unique name** with **StackId GUID tail**.
* **Parameter rejection** by engine (e.g., legacy query cache) → mitigated by setting **cluster param `query_cache_size=0`** and excluding unsupported params.
* **Rotation in private subnets** failing due to egress → mitigated via **VPC interface endpoints** for Secrets Manager and CloudWatch Logs.
* **Deployment capability errors** → explicitly require **`CAPABILITY_AUTO_EXPAND`** when using the transform.

## Operational notes:

* Confirm the **SNS subscription** email before relying on alarms.
* Consider Route 53 health checks + application failover patterns for broader HA/DR; current scope focuses on cluster optimization and observability.
* For blue/green, create a parallel stack with a distinct `EnvironmentSuffix`, validate, then cut over application connection strings to the new endpoints.

```yaml

AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::SecretsManager-2024-09-16
Description: >
  TapStack — Aurora MySQL (writer+2 readers) with tuned params, backtrack, Secrets Manager rotation,
  proactive CloudWatch alarms, and full VPC isolation. All names are suffixed with EnvironmentSuffix.

Metadata:
  cfn-lint:
    config:
      regions: [us-east-1]

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: Suffix applied to all names to prevent cross-environment collisions (use kebab-case).
    AllowedPattern: '^[a-z0-9]+(-[a-z0-9]+)*$'
    ConstraintDescription: Use lowercase letters, digits, and hyphens (kebab-case), e.g., prod-us.
    Default: prod-us
  AlarmEmail:
    Type: String
    Description: Email address to subscribe for alarm notifications.
    AllowedPattern: '^[^@]+@[^@]+\.[^@]+$'
    Default: trading-platform-alerts@example.com
  VpcCidr:
    Type: String
    Default: 10.42.0.0/16
    Description: CIDR for the application VPC.
  PrivateSubnet1Cidr:
    Type: String
    Default: 10.42.1.0/24
    Description: CIDR for private subnet in AZ a.
  PrivateSubnet2Cidr:
    Type: String
    Default: 10.42.2.0/24
    Description: CIDR for private subnet in AZ b.
  PrivateSubnet3Cidr:
    Type: String
    Default: 10.42.3.0/24
    Description: CIDR for private subnet in AZ c.
  DBName:
    Type: String
    Default: tradingdb
    Description: Initial database name.
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9_]{0,63}$'
  MasterUsername:
    Type: String
    Default: dbadmin
    Description: Master user name for the Aurora cluster.
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9_]{0,15}$'
  EngineVersion:
    Type: String
    Default: '5.7.mysql_aurora.2.11.5'
    Description: Aurora MySQL 2.x engine version compatible with MySQL 5.7 family.
  InstanceClass:
    Type: String
    Default: db.r5.2xlarge
    Description: DB instance class for writer and readers.

Mappings:
  Tags:
    Common:
      Environment: Production
      Team: Platform
      Service: Trading

Resources:

  # --------------------------
  # Networking (VPC & Subnets)
  # --------------------------
  Vpc:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub tap-vpc-${EnvironmentSuffix}
        - Key: Environment
          Value: !FindInMap [Tags, Common, Environment]
        - Key: Team
          Value: !FindInMap [Tags, Common, Team]
        - Key: Service
          Value: !FindInMap [Tags, Common, Service]

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet1Cidr
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub tap-private-az1-${EnvironmentSuffix}
        - Key: Environment
          Value: !FindInMap [Tags, Common, Environment]
        - Key: Team
          Value: !FindInMap [Tags, Common, Team]
        - Key: Service
          Value: !FindInMap [Tags, Common, Service]

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet2Cidr
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub tap-private-az2-${EnvironmentSuffix}
        - Key: Environment
          Value: !FindInMap [Tags, Common, Environment]
        - Key: Team
          Value: !FindInMap [Tags, Common, Team]
        - Key: Service
          Value: !FindInMap [Tags, Common, Service]

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref Vpc
      AvailabilityZone: !Select [2, !GetAZs '']
      CidrBlock: !Ref PrivateSubnet3Cidr
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub tap-private-az3-${EnvironmentSuffix}
        - Key: Environment
          Value: !FindInMap [Tags, Common, Environment]
        - Key: Team
          Value: !FindInMap [Tags, Common, Team]
        - Key: Service
          Value: !FindInMap [Tags, Common, Service]

  RouteTablePrivate:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref Vpc
      Tags:
        - Key: Name
          Value: !Sub tap-rtb-private-${EnvironmentSuffix}
        - Key: Environment
          Value: !FindInMap [Tags, Common, Environment]
        - Key: Team
          Value: !FindInMap [Tags, Common, Team]
        - Key: Service
          Value: !FindInMap [Tags, Common, Service]

  RouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref RouteTablePrivate
      SubnetId: !Ref PrivateSubnet1

  RouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref RouteTablePrivate
      SubnetId: !Ref PrivateSubnet2

  RouteTableAssociation3:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref RouteTablePrivate
      SubnetId: !Ref PrivateSubnet3

  # Interface VPC Endpoints for Secrets Manager & CloudWatch Logs (used by rotation)
  VpcEndpointSecretsManager:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref Vpc
      ServiceName: !Sub com.amazonaws.${AWS::Region}.secretsmanager
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      SecurityGroupIds:
        - !Ref RotationLambdaSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub tap-vpce-secretsmanager-${EnvironmentSuffix}

  VpcEndpointCloudWatch:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref Vpc
      ServiceName: !Sub com.amazonaws.${AWS::Region}.logs
      VpcEndpointType: Interface
      PrivateDnsEnabled: true
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      SecurityGroupIds:
        - !Ref RotationLambdaSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub tap-vpce-logs-${EnvironmentSuffix}

  # --------------------------
  # Security Groups
  # --------------------------
  AppSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Application tier SG allowed to connect to DB
      VpcId: !Ref Vpc
      SecurityGroupIngress: []
      Tags:
        - Key: Name
          Value: !Sub tap-app-sg-${EnvironmentSuffix}
        - Key: Environment
          Value: !FindInMap [Tags, Common, Environment]
        - Key: Team
          Value: !FindInMap [Tags, Common, Team]
        - Key: Service
          Value: !FindInMap [Tags, Common, Service]

  RotationLambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: SG for Secrets Manager hosted rotation lambda
      VpcId: !Ref Vpc
      SecurityGroupIngress: []
      Tags:
        - Key: Name
          Value: !Sub tap-rotate-sg-${EnvironmentSuffix}
        - Key: Environment
          Value: !FindInMap [Tags, Common, Environment]
        - Key: Team
          Value: !FindInMap [Tags, Common, Team]
        - Key: Service
          Value: !FindInMap [Tags, Common, Service]

  DbSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Database SG allowing MySQL from App and Rotation Lambda SGs
      VpcId: !Ref Vpc
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref AppSecurityGroup
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref RotationLambdaSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub tap-db-sg-${EnvironmentSuffix}
        - Key: Environment
          Value: !FindInMap [Tags, Common, Environment]
        - Key: Team
          Value: !FindInMap [Tags, Common, Team]
        - Key: Service
          Value: !FindInMap [Tags, Common, Service]

  # --------------------------
  # RDS Subnet Group
  # --------------------------
  DbSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: !Sub Aurora subnets (${EnvironmentSuffix})
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      DBSubnetGroupName: !Sub tap-dbsubnet-${EnvironmentSuffix}
      Tags:
        - Key: Name
          Value: !Sub tap-dbsubnet-${EnvironmentSuffix}
        - Key: Environment
          Value: !FindInMap [Tags, Common, Environment]
        - Key: Team
          Value: !FindInMap [Tags, Common, Team]
        - Key: Service
          Value: !FindInMap [Tags, Common, Service]

  # --------------------------
  # KMS CMK for RDS & Secrets
  # --------------------------
  KmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub CMK for RDS and Secrets (${EnvironmentSuffix})
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowRootAccount
            Effect: Allow
            Principal:
              AWS: !Sub arn:${AWS::Partition}:iam::${AWS::AccountId}:root
            Action: 'kms:*'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub tap-kms-${EnvironmentSuffix}
        - Key: Environment
          Value: !FindInMap [Tags, Common, Environment]
        - Key: Team
          Value: !FindInMap [Tags, Common, Team]
        - Key: Service
          Value: !FindInMap [Tags, Common, Service]
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain

  KmsAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub alias/tap-rds-${EnvironmentSuffix}
      TargetKeyId: !Ref KmsKey

  # --------------------------
  # Secrets Manager (Master Password) + Rotation (30 days)
  # --------------------------
  DbSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      # Valid characters only; unique per stack using StackId GUID tail
      Name:
        Fn::Sub:
          - tap/aurora/mysql/master/${EnvironmentSuffix}/${StackName}-${Guid}
          - StackName: !Ref 'AWS::StackName'
            Guid: !Select [2, !Split ['/', !Ref 'AWS::StackId']]
      Description: !Sub Master credentials secret for Aurora MySQL (${EnvironmentSuffix})
      KmsKeyId: !Ref KmsKey
      GenerateSecretString:
        SecretStringTemplate: !Sub |
          {"username":"${MasterUsername}"}
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: "\"@/"
      Tags:
        - Key: Name
          Value: !Sub tap-aurora-secret-${EnvironmentSuffix}
        - Key: Environment
          Value: !FindInMap [Tags, Common, Environment]
        - Key: Team
          Value: !FindInMap [Tags, Common, Team]
        - Key: Service
          Value: !FindInMap [Tags, Common, Service]
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain

  # Hosted rotation via Secrets Manager transform (no custom code required)
  SecretRotationSchedule:
    Type: AWS::SecretsManager::RotationSchedule
    Properties:
      SecretId: !Ref DbSecret
      RotationRules:
        AutomaticallyAfterDays: 30
      HostedRotationLambda:
        RotationType: MySQLSingleUser
        RotationLambdaName: !Sub tap-rotate-mysql-${EnvironmentSuffix}
        # Comma-delimited strings per transform schema
        VpcSecurityGroupIds: !Ref RotationLambdaSecurityGroup
        VpcSubnetIds: !Join
          - ','
          - - !Ref PrivateSubnet1
            - !Ref PrivateSubnet2
            - !Ref PrivateSubnet3

  # --------------------------
  # Parameter Groups
  # --------------------------
  # Cluster-level parameter group:
  # NOTE: Legacy MySQL query cache is disabled in Aurora MySQL 5.7; set to 0 to avoid validation errors.
  DbClusterParameterGroup:
    Type: AWS::RDS::DBClusterParameterGroup
    Properties:
      Description: !Sub Aurora MySQL cluster params (${EnvironmentSuffix})
      Family: aurora-mysql5.7
      Parameters:
        query_cache_size: '0'
        character_set_server: utf8mb4
        collation_server: utf8mb4_unicode_ci
      Tags:
        - Key: Name
          Value: !Sub tap-aurora-cluster-pg-${EnvironmentSuffix}
        - Key: Environment
          Value: !FindInMap [Tags, Common, Environment]
        - Key: Team
          Value: !FindInMap [Tags, Common, Team]
        - Key: Service
          Value: !FindInMap [Tags, Common, Service]

  # Instance-level parameter group for connection settings.
  # Keep only parameters known to be modifiable for Aurora MySQL 5.7.
  DbInstanceParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      Description: !Sub Aurora MySQL instance params (${EnvironmentSuffix})
      Family: aurora-mysql5.7
      Parameters:
        max_connections: '16000'
        # innodb_buffer_pool_size: '75%'   # advisory only; intentionally commented for Aurora auto-sizing compatibility.
      Tags:
        - Key: Name
          Value: !Sub tap-aurora-instance-pg-${EnvironmentSuffix}
        - Key: Environment
          Value: !FindInMap [Tags, Common, Environment]
        - Key: Team
          Value: !FindInMap [Tags, Common, Team]
        - Key: Service
          Value: !FindInMap [Tags, Common, Service]

  # --------------------------
  # Aurora Cluster & Instances
  # --------------------------
  DbCluster:
    Type: AWS::RDS::DBCluster
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      Engine: aurora-mysql
      EngineVersion: !Ref EngineVersion
      EngineMode: provisioned
      DBClusterIdentifier: !Sub tap-aurora-${EnvironmentSuffix}
      DatabaseName: !Ref DBName
      DBSubnetGroupName: !Ref DbSubnetGroup
      VpcSecurityGroupIds:
        - !Ref DbSecurityGroup
      KmsKeyId: !Ref KmsKey
      StorageEncrypted: true
      MasterUsername: !Ref MasterUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DbSecret}:SecretString:password}}'
      CopyTagsToSnapshot: true
      BackupRetentionPeriod: 7
      PreferredBackupWindow: 07:00-09:00
      PreferredMaintenanceWindow: sun:09:00-sun:11:00
      BacktrackWindow: 259200   # 72 hours in seconds
      DBClusterParameterGroupName: !Ref DbClusterParameterGroup
      Tags:
        - Key: Name
          Value: !Sub tap-aurora-cluster-${EnvironmentSuffix}
        - Key: Environment
          Value: !FindInMap [Tags, Common, Environment]
        - Key: Team
          Value: !FindInMap [Tags, Common, Team]
        - Key: Service
          Value: !FindInMap [Tags, Common, Service]

  DbInstanceWriter:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub tap-aurora-writer-${EnvironmentSuffix}
      DBInstanceClass: !Ref InstanceClass
      Engine: aurora-mysql
      EngineVersion: !Ref EngineVersion
      DBClusterIdentifier: !Ref DbCluster
      DBSubnetGroupName: !Ref DbSubnetGroup
      DBParameterGroupName: !Ref DbInstanceParameterGroup
      PubliclyAccessible: false
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      AutoMinorVersionUpgrade: true
      Tags:
        - Key: Name
          Value: !Sub tap-aurora-writer-${EnvironmentSuffix}
        - Key: Role
          Value: writer
        - Key: Environment
          Value: !FindInMap [Tags, Common, Environment]
        - Key: Team
          Value: !FindInMap [Tags, Common, Team]
        - Key: Service
          Value: !FindInMap [Tags, Common, Service]

  DbInstanceReader1:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub tap-aurora-reader1-${EnvironmentSuffix}
      DBInstanceClass: !Ref InstanceClass
      Engine: aurora-mysql
      EngineVersion: !Ref EngineVersion
      DBClusterIdentifier: !Ref DbCluster
      DBSubnetGroupName: !Ref DbSubnetGroup
      DBParameterGroupName: !Ref DbInstanceParameterGroup
      PubliclyAccessible: false
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      AutoMinorVersionUpgrade: true
      Tags:
        - Key: Name
          Value: !Sub tap-aurora-reader1-${EnvironmentSuffix}
        - Key: Role
          Value: reader
        - Key: Environment
          Value: !FindInMap [Tags, Common, Environment]
        - Key: Team
          Value: !FindInMap [Tags, Common, Team]
        - Key: Service
          Value: !FindInMap [Tags, Common, Service]

  DbInstanceReader2:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub tap-aurora-reader2-${EnvironmentSuffix}
      DBInstanceClass: !Ref InstanceClass
      Engine: aurora-mysql
      EngineVersion: !Ref EngineVersion
      DBClusterIdentifier: !Ref DbCluster
      DBSubnetGroupName: !Ref DbSubnetGroup
      DBParameterGroupName: !Ref DbInstanceParameterGroup
      PubliclyAccessible: false
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      AutoMinorVersionUpgrade: true
      Tags:
        - Key: Name
          Value: !Sub tap-aurora-reader2-${EnvironmentSuffix}
        - Key: Role
          Value: reader
        - Key: Environment
          Value: !FindInMap [Tags, Common, Environment]
        - Key: Team
          Value: !FindInMap [Tags, Common, Team]
        - Key: Service
          Value: !FindInMap [Tags, Common, Service]

  # --------------------------
  # SNS for Alarms
  # --------------------------
  SnsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub tap-aurora-alarms-${EnvironmentSuffix}
      KmsMasterKeyId: !Ref KmsKey
      Tags:
        - Key: Name
          Value: !Sub tap-aurora-alarms-${EnvironmentSuffix}
        - Key: Environment
          Value: !FindInMap [Tags, Common, Environment]
        - Key: Team
          Value: !FindInMap [Tags, Common, Team]
        - Key: Service
          Value: !FindInMap [Tags, Common, Service]

  SnsSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref SnsTopic
      Protocol: email
      Endpoint: !Ref AlarmEmail

  # --------------------------
  # CloudWatch Alarms (5)
  # --------------------------
  AlarmCpu:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub tap-aurora-cpu80-${EnvironmentSuffix}
      AlarmDescription: CPUUtilization > 80% on writer (5min)
      Namespace: AWS/RDS
      MetricName: CPUUtilization
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref DbInstanceWriter
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      AlarmActions: [!Ref SnsTopic]
      OKActions: [!Ref SnsTopic]
      Tags:
        - Key: Name
          Value: !Sub tap-aurora-cpu80-${EnvironmentSuffix}

  AlarmConnections:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub tap-aurora-connections-${EnvironmentSuffix}
      AlarmDescription: DatabaseConnections > 14000 at writer (5min)
      Namespace: AWS/RDS
      MetricName: DatabaseConnections
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref DbInstanceWriter
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 14000
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      AlarmActions: [!Ref SnsTopic]
      OKActions: [!Ref SnsTopic]
      Tags:
        - Key: Name
          Value: !Sub tap-aurora-connections-${EnvironmentSuffix}

  AlarmReadLatency:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub tap-aurora-read-latency-${EnvironmentSuffix}
      AlarmDescription: ReadLatency > 200ms on writer (5min)
      Namespace: AWS/RDS
      MetricName: ReadLatency
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref DbInstanceWriter
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 0.2
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      AlarmActions: [!Ref SnsTopic]
      OKActions: [!Ref SnsTopic]
      Tags:
        - Key: Name
          Value: !Sub tap-aurora-read-latency-${EnvironmentSuffix}

  AlarmWriteLatency:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub tap-aurora-write-latency-${EnvironmentSuffix}
      AlarmDescription: WriteLatency > 200ms on writer (5min)
      Namespace: AWS/RDS
      MetricName: WriteLatency
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref DbInstanceWriter
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 0.2
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      AlarmActions: [!Ref SnsTopic]
      OKActions: [!Ref SnsTopic]
      Tags:
        - Key: Name
          Value: !Sub tap-aurora-write-latency-${EnvironmentSuffix}

  AlarmReplicaLag:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub tap-aurora-replica-lag-${EnvironmentSuffix}
      AlarmDescription: AuroraReplicaLagMaximum > 1000ms at cluster (5min)
      Namespace: AWS/RDS
      MetricName: AuroraReplicaLagMaximum
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref DbCluster
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      AlarmActions: [!Ref SnsTopic]
      OKActions: [!Ref SnsTopic]
      Tags:
        - Key: Name
          Value: !Sub tap-aurora-replica-lag-${EnvironmentSuffix}

Outputs:
  ClusterArn:
    Description: Aurora cluster ARN
    Value: !GetAtt DbCluster.DBClusterArn
    Export:
      Name: !Sub tap-${EnvironmentSuffix}-cluster-arn

  ClusterIdentifier:
    Description: Aurora cluster identifier
    Value: !Ref DbCluster
    Export:
      Name: !Sub tap-${EnvironmentSuffix}-cluster-id

  WriterEndpoint:
    Description: Writer endpoint DNS
    Value: !GetAtt DbCluster.Endpoint.Address
    Export:
      Name: !Sub tap-${EnvironmentSuffix}-writer-endpoint

  ReaderEndpoint:
    Description: Reader endpoint DNS (Aurora distributes reads)
    Value: !GetAtt DbCluster.ReadEndpoint.Address
    Export:
      Name: !Sub tap-${EnvironmentSuffix}-reader-endpoint

  EngineVersionOut:
    Description: Engine version
    Value: !Ref EngineVersion
    Export:
      Name: !Sub tap-${EnvironmentSuffix}-engine-version

  DBInstanceWriterArn:
    Description: Writer instance DBI resource id
    Value: !GetAtt DbInstanceWriter.DbiResourceId
    Export:
      Name: !Sub tap-${EnvironmentSuffix}-writer-dbi-resource-id

  DBInstanceReader1Arn:
    Description: Reader1 instance DBI resource id
    Value: !GetAtt DbInstanceReader1.DbiResourceId
    Export:
      Name: !Sub tap-${EnvironmentSuffix}-reader1-dbi-resource-id

  DBInstanceReader2Arn:
    Description: Reader2 instance DBI resource id
    Value: !GetAtt DbInstanceReader2.DbiResourceId
    Export:
      Name: !Sub tap-${EnvironmentSuffix}-reader2-dbi-resource-id

  SecretArn:
    Description: Secrets Manager master credential secret ARN
    Value: !Ref DbSecret
    Export:
      Name: !Sub tap-${EnvironmentSuffix}-secret-arn

  RotationScheduleArn:
    Description: Rotation schedule ARN
    Value: !Ref SecretRotationSchedule
    Export:
      Name: !Sub tap-${EnvironmentSuffix}-rotation-arn

  SnsTopicArn:
    Description: SNS topic for alarms
    Value: !Ref SnsTopic
    Export:
      Name: !Sub tap-${EnvironmentSuffix}-sns-arn

  AlarmCpuArn:
    Description: Alarm ARN (CPU)
    Value: !GetAtt AlarmCpu.Arn
    Export:
      Name: !Sub tap-${EnvironmentSuffix}-alarm-cpu-arn

  AlarmConnectionsArn:
    Description: Alarm ARN (Connections)
    Value: !GetAtt AlarmConnections.Arn
    Export:
      Name: !Sub tap-${EnvironmentSuffix}-alarm-connections-arn

  AlarmReadLatencyArn:
    Description: Alarm ARN (ReadLatency)
    Value: !GetAtt AlarmReadLatency.Arn
    Export:
      Name: !Sub tap-${EnvironmentSuffix}-alarm-read-latency-arn

  AlarmWriteLatencyArn:
    Description: Alarm ARN (WriteLatency)
    Value: !GetAtt AlarmWriteLatency.Arn
    Export:
      Name: !Sub tap-${EnvironmentSuffix}-alarm-write-latency-arn

  AlarmReplicaLagArn:
    Description: Alarm ARN (ReplicaLag)
    Value: !GetAtt AlarmReplicaLag.Arn
    Export:
      Name: !Sub tap-${EnvironmentSuffix}-alarm-replica-lag-arn

  VpcId:
    Description: VPC Id
    Value: !Ref Vpc
    Export:
      Name: !Sub tap-${EnvironmentSuffix}-vpc-id

  DbSecurityGroupId:
    Description: DB Security Group Id
    Value: !Ref DbSecurityGroup
    Export:
      Name: !Sub tap-${EnvironmentSuffix}-db-sg-id

  AppSecurityGroupId:
    Description: App Security Group Id
    Value: !Ref AppSecurityGroup
    Export:
      Name: !Sub tap-${EnvironmentSuffix}-app-sg-id

  DbSubnetGroupName:
    Description: DB Subnet Group Name
    Value: !Ref DbSubnetGroup
    Export:
      Name: !Sub tap-${EnvironmentSuffix}-dbsubnet-name

  PrivateSubnetIds:
    Description: Comma-delimited list of private subnet IDs
    Value: !Join [ ',', [ !Ref PrivateSubnet1, !Ref PrivateSubnet2, !Ref PrivateSubnet3 ] ]
    Export:
      Name: !Sub tap-${EnvironmentSuffix}-private-subnets
```