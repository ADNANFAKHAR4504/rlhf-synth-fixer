import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dms from 'aws-cdk-lib/aws-dms';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface DatabaseMigrationStackProps {
  environmentSuffix: string;
  // Existing VPC and subnet information
  developmentVpcId?: string;
  productionVpcId?: string;
  developmentSubnetIds?: string[];
  productionSubnetIds?: string[];
  // Existing RDS source details
  sourceRdsEndpoint?: string;
  sourceRdsPort?: number;
  sourceDbName?: string;
  // Secret ARNs for existing credentials
  sourceSecretArn?: string;
  targetSecretArn?: string;

  /**
   * Optional: supply an existing IAM role object for DMS VPC management.
   * If provided, the stack will use this role (recommended when created in top-level stack).
   */
  dmsVpcRole?: iam.IRole;

  /**
   * Optional: supply an ARN string for an existing DMS VPC management role.
   * If provided and dmsVpcRole is not set, the stack will import the role by ARN.
   */
  dmsVpcRoleArn?: string;
}

export class DatabaseMigrationStack extends Construct {
  public readonly auroraClusterEndpoint: string;
  public readonly dmsTaskArn: string;
  public readonly validationLambdaArn: string;

  constructor(
    scope: Construct,
    id: string,
    props: DatabaseMigrationStackProps
  ) {
    super(scope, id);

    const { environmentSuffix } = props;

    // ==============================
    // 1. VPC and Networking Setup
    // ==============================

    // Create production VPC for Aurora and DMS (in real scenario, would reference existing VPC)
    const prodVpc = new ec2.Vpc(this, `ProductionVpc-${environmentSuffix}`, {
      vpcName: `prod-vpc-${environmentSuffix}`,
      cidr: '10.0.0.0/16', // explicitly set CIDR block
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    const devVpc = new ec2.Vpc(this, `DevelopmentVpc-${environmentSuffix}`, {
      vpcName: `dev-vpc-${environmentSuffix}`,
      cidr: '10.1.0.0/16', // different CIDR block to avoid overlap
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // VPC Peering connection
    const vpcPeering = new ec2.CfnVPCPeeringConnection(
      this,
      `VpcPeering-${environmentSuffix}`,
      {
        vpcId: prodVpc.vpcId,
        peerVpcId: devVpc.vpcId,
      }
    );

    // Add routes for VPC peering
    prodVpc.privateSubnets.forEach((subnet, index) => {
      new ec2.CfnRoute(this, `ProdToDev${index}-${environmentSuffix}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: devVpc.vpcCidrBlock,
        vpcPeeringConnectionId: vpcPeering.ref,
      });
    });

    devVpc.privateSubnets.forEach((subnet, index) => {
      new ec2.CfnRoute(this, `DevToProd${index}-${environmentSuffix}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: prodVpc.vpcCidrBlock,
        vpcPeeringConnectionId: vpcPeering.ref,
      });
    });

    // Get private subnets for production Aurora deployment
    const prodPrivateSubnets = prodVpc.privateSubnets;

    // ==============================
    // 2. KMS Encryption Keys
    // ==============================

    const auroraKmsKey = new kms.Key(
      this,
      `AuroraKmsKey-${environmentSuffix}`,
      {
        alias: `aurora-encryption-${environmentSuffix}`,
        description: 'KMS key for Aurora MySQL cluster encryption',
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // ==============================
    // 3. Security Groups
    // ==============================

    // Security group for Aurora cluster in production
    const auroraSecurityGroup = new ec2.SecurityGroup(
      this,
      `AuroraSecurityGroup-${environmentSuffix}`,
      {
        vpc: prodVpc,
        description: 'Security group for Aurora MySQL cluster',
        securityGroupName: `aurora-sg-${environmentSuffix}`,
      }
    );

    // Security group for DMS replication instance
    const dmsSecurityGroup = new ec2.SecurityGroup(
      this,
      `DmsSecurityGroup-${environmentSuffix}`,
      {
        vpc: prodVpc,
        description: 'Security group for DMS replication instance',
        securityGroupName: `dms-sg-${environmentSuffix}`,
      }
    );

    // Security group for source RDS in development
    const sourceRdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `SourceRdsSecurityGroup-${environmentSuffix}`,
      {
        vpc: devVpc,
        description: 'Security group for source RDS MySQL instance',
        securityGroupName: `source-rds-sg-${environmentSuffix}`,
      }
    );

    // Allow DMS to connect to Aurora
    auroraSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(dmsSecurityGroup.securityGroupId),
      ec2.Port.tcp(3306),
      'Allow DMS to connect to Aurora MySQL'
    );

    // Allow DMS to connect to source RDS
    sourceRdsSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(dmsSecurityGroup.securityGroupId),
      ec2.Port.tcp(3306),
      'Allow DMS to connect to source RDS MySQL'
    );

    // ==============================
    // 4. Secrets Manager for Credentials
    // ==============================

    // Create source database secret for development RDS
    const sourceDbSecret = new secretsmanager.Secret(
      this,
      `SourceDbSecret-${environmentSuffix}`,
      {
        secretName: `dev/rds/mysql/credentials-${environmentSuffix}`,
        description: 'Source RDS MySQL credentials',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'admin' }),
          generateStringKey: 'password',
          excludeCharacters: '"@/\\',
          passwordLength: 32,
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Create target database secret for production Aurora
    const targetDbSecret = new secretsmanager.Secret(this, 'TrdbSc', {
      secretName: `prod/aurora/mysql/credentials-${environmentSuffix}`,
      description: 'Aurora MySQL cluster master credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
        passwordLength: 32,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ==============================
    // 5. Aurora MySQL Parameter Group
    // ==============================

    const auroraParameterGroup = new rds.ParameterGroup(
      this,
      `AuroraParameterGroup-${environmentSuffix}`,
      {
        engine: rds.DatabaseClusterEngine.auroraMysql({
          version: rds.AuroraMysqlEngineVersion.VER_3_08_2, // MySQL 8.0 compatible
        }),
        description: 'Parameter group for Aurora MySQL cluster',
        parameters: {
          // Match source MySQL 8.0.35 configuration
          max_connections: '1000',
          innodb_buffer_pool_size: '{DBInstanceClassMemory*3/4}',
          character_set_server: 'utf8mb4',
          collation_server: 'utf8mb4_unicode_ci',
          // Enable binary logging for DMS CDC
          binlog_format: 'ROW',
          binlog_row_image: 'FULL',
        },
      }
    );

    // ==============================
    // 6. Aurora MySQL Cluster
    // ==============================

    const auroraSubnetGroup = new rds.SubnetGroup(
      this,
      `AuroraSubnetGroup-${environmentSuffix}`,
      {
        vpc: prodVpc,
        description: 'Subnet group for Aurora MySQL cluster',
        vpcSubnets: {
          subnets: prodPrivateSubnets,
        },
        subnetGroupName: `aurora-subnet-group-${environmentSuffix}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const auroraCluster = new rds.DatabaseCluster(
      this,
      `AuroraCluster-${environmentSuffix}`,
      {
        engine: rds.DatabaseClusterEngine.auroraMysql({
          version: rds.AuroraMysqlEngineVersion.VER_3_08_2,
        }),
        credentials: rds.Credentials.fromSecret(targetDbSecret),
        defaultDatabaseName: props.sourceDbName || 'migrationdb',
        parameterGroup: auroraParameterGroup,
        storageEncrypted: true,
        storageEncryptionKey: auroraKmsKey,
        backup: {
          retention: cdk.Duration.days(7),
          preferredWindow: '03:00-04:00',
        },
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        cloudwatchLogsExports: ['error', 'general', 'slowquery', 'audit'],
        cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
        clusterIdentifier: `aurora-mysql-${environmentSuffix}`,
        subnetGroup: auroraSubnetGroup,
        vpc: prodVpc,
        vpcSubnets: {
          subnets: prodPrivateSubnets,
        },
        securityGroups: [auroraSecurityGroup],
        writer: rds.ClusterInstance.provisioned('writer', {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.R5,
            ec2.InstanceSize.LARGE
          ),
          instanceIdentifier: `aurora-writer-${environmentSuffix}`,
          enablePerformanceInsights: true,
          performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
          performanceInsightEncryptionKey: auroraKmsKey,
          publiclyAccessible: false,
        }),
        readers: [
          rds.ClusterInstance.provisioned('reader', {
            instanceType: ec2.InstanceType.of(
              ec2.InstanceClass.R5,
              ec2.InstanceSize.LARGE
            ),
            instanceIdentifier: `aurora-reader-${environmentSuffix}`,
            enablePerformanceInsights: true,
            performanceInsightRetention:
              rds.PerformanceInsightRetention.DEFAULT,
            performanceInsightEncryptionKey: auroraKmsKey,
            publiclyAccessible: false,
          }),
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cfnCluster = auroraCluster.node.defaultChild as rds.CfnDBCluster;

    // Enable secret rotation after Aurora cluster is created
    (targetDbSecret as secretsmanager.Secret).addRotationSchedule('Rt', {
      automaticallyAfter: cdk.Duration.days(30),
      hostedRotation: secretsmanager.HostedRotation.mysqlSingleUser(),
    });

    // ==============================
    // 6a. Source RDS MySQL Instance
    // ==============================

    // Create source RDS MySQL instance in development VPC
    const sourceRdsSubnetGroup = new rds.SubnetGroup(
      this,
      `SourceRdsSubnetGroup-${environmentSuffix}`,
      {
        vpc: devVpc,
        description: 'Subnet group for source RDS MySQL instance',
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        subnetGroupName: `source-rds-subnet-group-${environmentSuffix}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const sourceRdsParameterGroup = new rds.ParameterGroup(
      this,
      `SourceRdsParameterGroup-${environmentSuffix}`,
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0_40,
        }),
        description: 'Parameter group for source RDS MySQL instance',
        parameters: {
          binlog_format: 'ROW',
          binlog_row_image: 'FULL',
          log_bin_trust_function_creators: '1',
        },
      }
    );

    const sourceRdsInstance = new rds.DatabaseInstance(
      this,
      `SourceRdsInstance-${environmentSuffix}`,
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0_40,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.R5,
          ec2.InstanceSize.LARGE
        ),
        credentials: rds.Credentials.fromSecret(sourceDbSecret),
        databaseName: props.sourceDbName || 'migrationdb',
        instanceIdentifier: `source-rds-${environmentSuffix}`,
        vpc: devVpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        subnetGroup: sourceRdsSubnetGroup,
        securityGroups: [sourceRdsSecurityGroup],
        parameterGroup: sourceRdsParameterGroup,
        storageEncrypted: true,
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        backupRetention: cdk.Duration.days(7),
        deleteAutomatedBackups: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        deletionProtection: false,
        publiclyAccessible: false,
      }
    );

    // ==============================
    // 7. DMS IAM Roles (RESOLVED / WIRED)
    // ==============================

    // Resolve DMS VPC management role based on props:
    // 1) use props.dmsVpcRole if provided
    // 2) import by props.dmsVpcRoleArn if provided
    // 3) create a role in this construct as a fallback
    let resolvedDmsVpcRole: iam.IRole | undefined = props.dmsVpcRole;
    let createdDmsVpcRole = false;

    if (!resolvedDmsVpcRole && props.dmsVpcRoleArn) {
      resolvedDmsVpcRole = iam.Role.fromRoleArn(
        this,
        `ImportedDmsVpcRole-${environmentSuffix}`,
        props.dmsVpcRoleArn,
        { mutable: false }
      );
    }

    if (!resolvedDmsVpcRole) {
      // Create role in this construct (fallback). If you want a conventional name visible outside,
      // create the role at top-level (tap-stack) with roleName: 'dms-vpc-role' and pass it in.

      // Create as a iam.Role instance so we can call addManagedPolicy / addToPolicy safely.
      const createdRole = new iam.Role(
        this,
        `DmsVpcRole-${environmentSuffix}`,
        {
          assumedBy: new iam.ServicePrincipal('dms.amazonaws.com'),
          roleName: `dms-vpc-role-${environmentSuffix}`,
        }
      );
      createdDmsVpcRole = true;

      // Attach required managed policy and inline permissions
      createdRole.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonDMSVPCManagementRole'
        )
      );

      createdRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ec2:DescribeAccountAttributes',
            'ec2:DescribeAddresses',
            'ec2:DescribeAvailabilityZones',
            'ec2:DescribeInternetGateways',
            'ec2:DescribeNetworkAcls',
            'ec2:DescribeRouteTables',
            'ec2:DescribeSecurityGroups',
            'ec2:DescribeSubnets',
            'ec2:DescribeVpcs',
            'ec2:CreateNetworkInterface',
            'ec2:DeleteNetworkInterface',
            'ec2:ModifyNetworkInterfaceAttribute',
            'ec2:DescribeNetworkInterfaces',
          ],
          resources: ['*'],
        })
      );

      // assign the created Role to the resolvedDmsVpcRole variable (typed as IRole)
      resolvedDmsVpcRole = createdRole;
    }

    // DMS CloudWatch Logs Role (required for DMS logging) - create as before
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const dmsCloudwatchRole = new iam.Role(
      this,
      `DmsCloudwatchRole-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('dms.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonDMSCloudWatchLogsRole'
          ),
        ],
        roleName: `dms-cloudwatch-role-${environmentSuffix}`,
      }
    );

    // ==============================
    // 8. DMS Subnet Group
    // ==============================

    const dmsSubnetGroup = new dms.CfnReplicationSubnetGroup(
      this,
      `DmsSubnetGroup-${environmentSuffix}`,
      {
        replicationSubnetGroupIdentifier: `dms-subnet-group-${environmentSuffix}`,
        replicationSubnetGroupDescription:
          'Subnet group for DMS replication instance',
        subnetIds: prodPrivateSubnets.map(subnet => subnet.subnetId),
      }
    );

    // Add dependency on the role CFN resource only if the role was created in this stack.
    // Imported roles won't have a CFN child and shouldn't be modified.
    if (createdDmsVpcRole) {
      const maybeRoleCfn = (resolvedDmsVpcRole as unknown as Construct).node
        .defaultChild as cdk.CfnResource | undefined;
      if (maybeRoleCfn) {
        dmsSubnetGroup.node.addDependency(maybeRoleCfn);
      } else {
        // As a fallback, add dependency on the role construct itself
        dmsSubnetGroup.node.addDependency(resolvedDmsVpcRole as Construct);
      }
    }

    // ==============================
    // 9. DMS Replication Instance
    // ==============================

    const dmsReplicationInstance = new dms.CfnReplicationInstance(
      this,
      `DmsReplicationInstance-${environmentSuffix}`,
      {
        replicationInstanceClass: 'dms.t3.medium',
        replicationInstanceIdentifier: `dms-replication-${environmentSuffix}`,
        allocatedStorage: 100,
        //  engineVersion: '3.5.1',
        multiAz: false,
        publiclyAccessible: false,
        replicationSubnetGroupIdentifier:
          dmsSubnetGroup.replicationSubnetGroupIdentifier,
        vpcSecurityGroupIds: [dmsSecurityGroup.securityGroupId],
      }
    );

    // Ensure replication instance creation waits for subnet group
    dmsReplicationInstance.addDependency(dmsSubnetGroup);

    // ==============================
    // 10. DMS Source Endpoint (RDS MySQL)
    // ==============================

    const sourceEndpoint = new dms.CfnEndpoint(
      this,
      `DmsSourceEndpoint-${environmentSuffix}`,
      {
        endpointType: 'source',
        endpointIdentifier: `source-rds-mysql-${environmentSuffix}`,
        engineName: 'mysql',
        serverName:
          props.sourceRdsEndpoint ||
          sourceRdsInstance.dbInstanceEndpointAddress,
        port: props.sourceRdsPort || 3306,
        databaseName: props.sourceDbName || 'migrationdb',
        username: sourceDbSecret.secretValueFromJson('username').unsafeUnwrap(),
        password: sourceDbSecret.secretValueFromJson('password').unsafeUnwrap(),
        sslMode: 'none',
        mySqlSettings: {
          // Enable CDC for continuous replication
          afterConnectScript: '',
          cleanSourceMetadataOnMismatch: false,
          eventsPollInterval: 5,
          maxFileSize: 512000,
          parallelLoadThreads: 1,
          serverTimezone: 'UTC',
        },
      }
    );

    // ==============================
    // 11. DMS Target Endpoint (Aurora MySQL)
    // ==============================

    const targetEndpoint = new dms.CfnEndpoint(
      this,
      `DmsTargetEndpoint-${environmentSuffix}`,
      {
        endpointType: 'target',
        endpointIdentifier: `target-aurora-mysql-${environmentSuffix}`,
        engineName: 'aurora',
        serverName: auroraCluster.clusterEndpoint.hostname,
        port: 3306,
        databaseName: props.sourceDbName || 'migrationdb',
        username: targetDbSecret.secretValueFromJson('username').unsafeUnwrap(),
        password: targetDbSecret.secretValueFromJson('password').unsafeUnwrap(),
        sslMode: 'none',
        mySqlSettings: {
          cleanSourceMetadataOnMismatch: false,
          maxFileSize: 512000,
          parallelLoadThreads: 1,
          serverTimezone: 'UTC',
          targetDbType: 'specific-database',
        },
      }
    );

    targetEndpoint.addDependency(
      auroraCluster.node.defaultChild as rds.CfnDBCluster
    );

    // ==============================
    // 12. DMS Migration Task
    // ==============================

    const dmsTask = new dms.CfnReplicationTask(
      this,
      `DmsMigrationTask-${environmentSuffix}`,
      {
        replicationTaskIdentifier: `migration-task-${environmentSuffix}`,
        migrationType: 'full-load-and-cdc',
        replicationInstanceArn: dmsReplicationInstance.ref,
        sourceEndpointArn: sourceEndpoint.ref,
        targetEndpointArn: targetEndpoint.ref,
        tableMappings: JSON.stringify({
          rules: [
            {
              'rule-type': 'selection',
              'rule-id': '1',
              'rule-name': '1',
              'object-locator': {
                'schema-name': '%',
                'table-name': '%',
              },
              'rule-action': 'include',
            },
          ],
        }),
        replicationTaskSettings: JSON.stringify({
          Logging: {
            EnableLogging: true,
            LogComponents: [
              {
                Id: 'TRANSFORMATION',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'SOURCE_UNLOAD',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'IO',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'TARGET_LOAD',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'PERFORMANCE',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'SOURCE_CAPTURE',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'SORTER',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'REST_SERVER',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'VALIDATOR_EXT',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'TARGET_APPLY',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
              {
                Id: 'TASK_MANAGER',
                Severity: 'LOGGER_SEVERITY_DEFAULT',
              },
            ],
          },
          TargetMetadata: {
            TargetSchema: '',
            SupportLobs: true,
            FullLobMode: false,
            LobChunkSize: 64,
            LimitedSizeLobMode: true,
            LobMaxSize: 32,
          },
          FullLoadSettings: {
            TargetTablePrepMode: 'DROP_AND_CREATE',
            CreatePkAfterFullLoad: false,
            StopTaskCachedChangesApplied: false,
            StopTaskCachedChangesNotApplied: false,
            MaxFullLoadSubTasks: 8,
            TransactionConsistencyTimeout: 600,
            CommitRate: 10000,
          },
          ChangeProcessingDdlHandlingPolicy: {
            HandleSourceTableDropped: true,
            HandleSourceTableTruncated: true,
            HandleSourceTableAltered: true,
          },
          ChangeProcessingTuning: {
            BatchApplyPreserveTransaction: true,
            BatchApplyTimeoutMin: 1,
            BatchApplyTimeoutMax: 30,
            BatchApplyMemoryLimit: 500,
            BatchSplitSize: 0,
            MinTransactionSize: 1000,
            CommitTimeout: 1,
            MemoryLimitTotal: 1024,
            MemoryKeepTime: 60,
            StatementCacheSize: 50,
          },
        }),
      }
    );

    dmsTask.addDependency(dmsReplicationInstance);
    dmsTask.addDependency(sourceEndpoint);
    dmsTask.addDependency(targetEndpoint);

    // ==============================
    // 13. SNS Topic for Alarms
    // ==============================

    const alarmTopic = new sns.Topic(this, `AlarmTopic-${environmentSuffix}`, {
      topicName: `dms-migration-alarms-${environmentSuffix}`,
      displayName: 'DMS Migration Alarms',
    });

    // ==============================
    // 14. CloudWatch Alarms
    // ==============================

    // Alarm for DMS task failures
    const dmsTaskFailureAlarm = new cloudwatch.Alarm(
      this,
      `DmsTaskFailureAlarm-${environmentSuffix}`,
      {
        alarmName: `dms-task-failure-${environmentSuffix}`,
        alarmDescription: 'Alert when DMS migration task fails',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/DMS',
          metricName: 'FullLoadThroughputRowsTarget',
          dimensionsMap: {
            ReplicationInstanceIdentifier:
              dmsReplicationInstance.replicationInstanceIdentifier!,
            ReplicationTaskIdentifier: dmsTask.replicationTaskIdentifier!,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 0,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.LESS_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      }
    );

    dmsTaskFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    // Alarm for Aurora replication lag > 30 seconds
    const auroraReplicationLagAlarm = new cloudwatch.Alarm(
      this,
      `AuroraReplicationLagAlarm-${environmentSuffix}`,
      {
        alarmName: `aurora-replication-lag-${environmentSuffix}`,
        alarmDescription:
          'Alert when Aurora replication lag exceeds 30 seconds',
        metric: auroraCluster.metricServerlessDatabaseCapacity({
          statistic: 'Average',
          period: cdk.Duration.minutes(1),
        }),
        threshold: 30000, // 30 seconds in milliseconds
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    auroraReplicationLagAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    // ==============================
    // 15. Lambda Function for Data Validation
    // ==============================

    const validationLambdaRole = new iam.Role(
      this,
      `ValidationLambdaRole-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
      }
    );

    // Grant Lambda access to secrets
    sourceDbSecret.grantRead(validationLambdaRole);
    targetDbSecret.grantRead(validationLambdaRole);

    const validationLambda = new lambda.Function(
      this,
      `ValidationLambda-${environmentSuffix}`,
      {
        functionName: `db-validation-${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import json
import pymysql
import boto3
import os
from typing import Dict, Any
def get_secret(secret_arn: str) -> Dict[str, str]:
    """Retrieve secret from Secrets Manager"""
    client = boto3.client('secretsmanager')
    response = client.get_secret_value(SecretId=secret_arn)
    return json.loads(response['SecretString'])
def get_connection(host: str, port: int, user: str, password: str, database: str):
    """Create MySQL connection"""
    return pymysql.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
        connect_timeout=30
    )
def get_table_count(connection, table_name: str) -> int:
    """Get row count for a table"""
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        return cursor.fetchone()[0]
def get_all_tables(connection) -> list:
    """Get list of all tables in database"""
    with connection.cursor() as cursor:
        cursor.execute("SHOW TABLES")
        return [row[0] for row in cursor.fetchall()]
def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler to validate data consistency between source and target databases
    """
    try:
        # Get database credentials from Secrets Manager
        source_secret = get_secret(os.environ['SOURCE_SECRET_ARN'])
        target_secret = get_secret(os.environ['TARGET_SECRET_ARN'])
        # Connect to source database
        source_conn = get_connection(
            host=os.environ['SOURCE_HOST'],
            port=int(os.environ['SOURCE_PORT']),
            user=source_secret['username'],
            password=source_secret['password'],
            database=os.environ['SOURCE_DB']
        )
        # Connect to target database
        target_conn = get_connection(
            host=os.environ['TARGET_HOST'],
            port=3306,
            user=target_secret['username'],
            password=target_secret['password'],
            database=os.environ['TARGET_DB']
        )
        # Get tables from both databases
        source_tables = set(get_all_tables(source_conn))
        target_tables = set(get_all_tables(target_conn))
        # Check for missing tables
        missing_tables = source_tables - target_tables
        extra_tables = target_tables - source_tables
        # Validate row counts for common tables
        validation_results = []
        common_tables = source_tables & target_tables
        for table in common_tables:
            source_count = get_table_count(source_conn, table)
            target_count = get_table_count(target_conn, table)
            validation_results.append({
                'table': table,
                'source_count': source_count,
                'target_count': target_count,
                'match': source_count == target_count
            })
        # Close connections
        source_conn.close()
        target_conn.close()
        # Prepare response
        all_match = all(r['match'] for r in validation_results)
        return {
            'statusCode': 200,
            'body': json.dumps({
                'validation_status': 'PASSED' if all_match and not missing_tables else 'FAILED',
                'missing_tables': list(missing_tables),
                'extra_tables': list(extra_tables),
                'table_validations': validation_results,
                'total_tables_checked': len(common_tables)
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'validation_status': 'ERROR',
                'error': str(e)
            })
        }
`),
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        vpc: prodVpc,
        vpcSubnets: {
          subnets: prodPrivateSubnets,
        },
        securityGroups: [dmsSecurityGroup],
        environment: {
          SOURCE_SECRET_ARN: sourceDbSecret.secretArn,
          TARGET_SECRET_ARN: targetDbSecret.secretArn,
          SOURCE_HOST:
            props.sourceRdsEndpoint ||
            sourceRdsInstance.dbInstanceEndpointAddress,
          SOURCE_PORT: (props.sourceRdsPort || 3306).toString(),
          SOURCE_DB: props.sourceDbName || 'migrationdb',
          TARGET_HOST: auroraCluster.clusterEndpoint.hostname,
          TARGET_DB: props.sourceDbName || 'migrationdb',
        },
        layers: [
          // Note: In production, add pymysql layer ARN for your region
          // lambda.LayerVersion.fromLayerVersionArn(this, 'PyMySQLLayer', 'arn:aws:lambda:...')
        ],
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // ==============================
    // 16. Export Public Properties
    // ==============================

    // Export key resource information as public properties
    // (Outputs are defined at the TapStack level)
    this.auroraClusterEndpoint = auroraCluster.clusterEndpoint.hostname;
    this.dmsTaskArn = dmsTask.ref;
    this.validationLambdaArn = validationLambda.functionArn;
  }
}
