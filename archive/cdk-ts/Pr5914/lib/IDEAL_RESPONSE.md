# Ideal Response - TypeScript Source Reference

This document captures every TypeScript file under the `lib/` and `bin/` directories. Each section embeds the exact source within `ts` code fences for quick reference.

## Table of Contents
1. [bin/tap.ts](#bin-tap-ts)
2. [lib/constructs/database-construct.ts](#lib-constructs-database-construct-ts)
3. [lib/constructs/dms-construct.ts](#lib-constructs-dms-construct-ts)
4. [lib/constructs/network-construct.ts](#lib-constructs-network-construct-ts)
5. [lib/tap-stack.ts](#lib-tap-stack-ts)

---

## bin/tap.ts
**Path:** `bin/tap.ts`

```ts
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});
```

---

## lib/constructs/database-construct.ts
**Path:** `lib/constructs/database-construct.ts`

```ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DatabaseConstructProps {
  environmentSuffix: string;
  vpc: ec2.IVpc;
  securityGroup: ec2.SecurityGroup;
}

export class DatabaseConstruct extends Construct {
  public readonly cluster: rds.DatabaseCluster;
  public readonly secret: secretsmanager.Secret;
  public readonly clusterEndpoint: string;
  public readonly readerEndpoint: string;
  public readonly clusterEndpointHostname: string;
  public readonly clusterEndpointPort: number;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    // Create secret for database credentials
    this.secret = new secretsmanager.Secret(
      this,
      `db-credentials-${props.environmentSuffix}`,
      {
        secretName: `aurora-credentials-${props.environmentSuffix}`,
        description: 'Aurora PostgreSQL database credentials',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'postgres' }),
          generateStringKey: 'password',
          excludePunctuation: true,
          includeSpace: false,
          passwordLength: 32,
        },
      }
    );

    // Disable automatic rotation
    // Note: CDK doesn't enable rotation by default, so we don't need to explicitly disable it

    // Create custom parameter group with max_connections=1000
    const parameterGroup = new rds.ParameterGroup(
      this,
      `db-params-${props.environmentSuffix}`,
      {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_14_13,
        }),
        description: 'Custom parameter group with max_connections=1000',
        parameters: {
          max_connections: '1000',
        },
      }
    );

    // Create Aurora PostgreSQL cluster
    this.cluster = new rds.DatabaseCluster(
      this,
      `aurora-cluster-${props.environmentSuffix}`,
      {
        clusterIdentifier: `aurora-cluster-${props.environmentSuffix}`,
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_14_13,
        }),
        credentials: rds.Credentials.fromSecret(this.secret),
        writer: rds.ClusterInstance.provisioned(
          `writer-${props.environmentSuffix}`,
          {
            instanceType: ec2.InstanceType.of(
              ec2.InstanceClass.R5,
              ec2.InstanceSize.LARGE
            ),
            publiclyAccessible: false,
          }
        ),
        readers: [
          rds.ClusterInstance.provisioned(
            `reader-1-${props.environmentSuffix}`,
            {
              instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.R5,
                ec2.InstanceSize.LARGE
              ),
              publiclyAccessible: false,
            }
          ),
          rds.ClusterInstance.provisioned(
            `reader-2-${props.environmentSuffix}`,
            {
              instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.R5,
                ec2.InstanceSize.LARGE
              ),
              publiclyAccessible: false,
            }
          ),
        ],
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [props.securityGroup],
        parameterGroup: parameterGroup,
        backup: {
          retention: cdk.Duration.days(7),
          preferredWindow: '03:00-04:00',
        },
        cloudwatchLogsExports: ['postgresql'],
        cloudwatchLogsRetention: 7,
        storageEncrypted: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow clean destruction
      }
    );

    this.clusterEndpoint = this.cluster.clusterEndpoint.socketAddress;
    this.readerEndpoint = this.cluster.clusterReadEndpoint.socketAddress;
    this.clusterEndpointHostname = this.cluster.clusterEndpoint.hostname;
    this.clusterEndpointPort = this.cluster.clusterEndpoint.port;

    // Tag resources
    cdk.Tags.of(this.cluster).add('Environment', 'production');
    cdk.Tags.of(this.cluster).add('MigrationProject', '2024Q1');
    cdk.Tags.of(this.secret).add('Environment', 'production');
    cdk.Tags.of(this.secret).add('MigrationProject', '2024Q1');
    cdk.Tags.of(parameterGroup).add('Environment', 'production');
    cdk.Tags.of(parameterGroup).add('MigrationProject', '2024Q1');
  }
}

```

---

## lib/constructs/dms-construct.ts
**Path:** `lib/constructs/dms-construct.ts`

```ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as dms from 'aws-cdk-lib/aws-dms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DmsConstructProps {
  environmentSuffix: string;
  vpc: ec2.IVpc;
  securityGroup: ec2.SecurityGroup;
  targetEndpoint: string;
  targetEndpointHostname: string;
  targetEndpointPort: number;
  targetSecret: secretsmanager.Secret;
  sourceHost: string;
  sourcePort: number;
  sourceDatabase: string;
  sourceUsername: string;
  sourcePassword: string;
}

export class DmsConstruct extends Construct {
  public readonly replicationInstance: dms.CfnReplicationInstance;
  public readonly sourceEndpoint: dms.CfnEndpoint;
  public readonly targetEndpoint: dms.CfnEndpoint;
  public readonly migrationTask: dms.CfnReplicationTask;
  public readonly taskArn: string;

  constructor(scope: Construct, id: string, props: DmsConstructProps) {
    super(scope, id);

    // Create DMS subnet group
    const dmsSubnetGroup = new dms.CfnReplicationSubnetGroup(
      this,
      `dms-subnet-group-${props.environmentSuffix}`,
      {
        replicationSubnetGroupDescription: 'DMS replication subnet group',
        replicationSubnetGroupIdentifier: `dms-subnet-group-${props.environmentSuffix}`,
        subnetIds: props.vpc.privateSubnets.map(subnet => subnet.subnetId),
        tags: [
          { key: 'Environment', value: 'production' },
          { key: 'MigrationProject', value: '2024Q1' },
        ],
      }
    );

    // Create DMS IAM roles
    const dmsVpcRole = new iam.Role(
      this,
      `dms-vpc-role-${props.environmentSuffix}`,
      {
        roleName: `dms-vpc-role-${props.environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('dms.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonDMSVPCManagementRole'
          ),
        ],
      }
    );

    const dmsCloudWatchRole = new iam.Role(
      this,
      `dms-cloudwatch-role-${props.environmentSuffix}`,
      {
        roleName: `dms-cloudwatch-role-${props.environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('dms.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonDMSCloudWatchLogsRole'
          ),
        ],
      }
    );

    // Create DMS replication instance
    this.replicationInstance = new dms.CfnReplicationInstance(
      this,
      `dms-instance-${props.environmentSuffix}`,
      {
        replicationInstanceIdentifier: `dms-instance-${props.environmentSuffix}`,
        replicationInstanceClass: 'dms.r5.large',
        allocatedStorage: 100,
        vpcSecurityGroupIds: [props.securityGroup.securityGroupId],
        replicationSubnetGroupIdentifier:
          dmsSubnetGroup.replicationSubnetGroupIdentifier,
        publiclyAccessible: false,
        multiAz: false,
        // Remove engineVersion to use the default latest version available in the region
        tags: [
          { key: 'Environment', value: 'production' },
          { key: 'MigrationProject', value: '2024Q1' },
        ],
      }
    );

    this.replicationInstance.addDependency(dmsSubnetGroup);

    // Create source endpoint (on-premises PostgreSQL)
    this.sourceEndpoint = new dms.CfnEndpoint(
      this,
      `source-endpoint-${props.environmentSuffix}`,
      {
        endpointIdentifier: `source-endpoint-${props.environmentSuffix}`,
        endpointType: 'source',
        engineName: 'postgres',
        serverName: props.sourceHost,
        port: props.sourcePort,
        databaseName: props.sourceDatabase,
        username: props.sourceUsername,
        password: props.sourcePassword,
        tags: [
          { key: 'Environment', value: 'production' },
          { key: 'MigrationProject', value: '2024Q1' },
        ],
      }
    );

    // Create target endpoint (Aurora PostgreSQL)
    this.targetEndpoint = new dms.CfnEndpoint(
      this,
      `target-endpoint-${props.environmentSuffix}`,
      {
        endpointIdentifier: `target-endpoint-${props.environmentSuffix}`,
        endpointType: 'target',
        engineName: 'aurora-postgresql',
        serverName: props.targetEndpointHostname,
        port: props.targetEndpointPort,
        databaseName: 'postgres',
        username: props.targetSecret
          .secretValueFromJson('username')
          .unsafeUnwrap(),
        password: props.targetSecret
          .secretValueFromJson('password')
          .unsafeUnwrap(),
        tags: [
          { key: 'Environment', value: 'production' },
          { key: 'MigrationProject', value: '2024Q1' },
        ],
      }
    );

    // Create migration task with full load and CDC
    const tableMappings = {
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
    };

    const taskSettings = {
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
        ],
      },
      ControlTablesSettings: {
        ControlSchema: 'dms_control',
        HistoryTimeslotInMinutes: 5,
        HistoryTableEnabled: true,
        SuspendedTablesTableEnabled: true,
        StatusTableEnabled: true,
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
    };

    this.migrationTask = new dms.CfnReplicationTask(
      this,
      `migration-task-${props.environmentSuffix}`,
      {
        replicationTaskIdentifier: `migration-task-${props.environmentSuffix}`,
        replicationInstanceArn: this.replicationInstance.ref,
        sourceEndpointArn: this.sourceEndpoint.ref,
        targetEndpointArn: this.targetEndpoint.ref,
        migrationType: 'full-load-and-cdc',
        tableMappings: JSON.stringify(tableMappings),
        replicationTaskSettings: JSON.stringify(taskSettings),
        tags: [
          { key: 'Environment', value: 'production' },
          { key: 'MigrationProject', value: '2024Q1' },
        ],
      }
    );

    // Ensure proper dependencies
    this.migrationTask.addDependency(this.replicationInstance);
    this.sourceEndpoint.addDependency(this.replicationInstance);
    this.targetEndpoint.addDependency(this.replicationInstance);

    this.taskArn = this.migrationTask.ref;

    // Tag IAM roles
    cdk.Tags.of(dmsVpcRole).add('Environment', 'production');
    cdk.Tags.of(dmsVpcRole).add('MigrationProject', '2024Q1');
    cdk.Tags.of(dmsCloudWatchRole).add('Environment', 'production');
    cdk.Tags.of(dmsCloudWatchRole).add('MigrationProject', '2024Q1');
  }
}

```

---

## lib/constructs/network-construct.ts
**Path:** `lib/constructs/network-construct.ts`

```ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkConstructProps {
  environmentSuffix: string;
}

export class NetworkConstruct extends Construct {
  public readonly vpc: ec2.IVpc;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;
  public readonly applicationSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkConstructProps) {
    super(scope, id);

    // Create VPC with private subnets for the database
    this.vpc = new ec2.Vpc(this, `migration-vpc-${props.environmentSuffix}`, {
      vpcName: `migration-vpc-${props.environmentSuffix}`,
      maxAzs: 3,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Create security group for the application tier
    this.applicationSecurityGroup = new ec2.SecurityGroup(
      this,
      `app-sg-${props.environmentSuffix}`,
      {
        vpc: this.vpc,
        securityGroupName: `app-sg-${props.environmentSuffix}`,
        description: 'Security group for application tier',
        allowAllOutbound: true,
      }
    );

    // Create security group for the database
    this.databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      `database-sg-${props.environmentSuffix}`,
      {
        vpc: this.vpc,
        securityGroupName: `database-sg-${props.environmentSuffix}`,
        description: 'Security group for Aurora PostgreSQL database',
        allowAllOutbound: true,
      }
    );

    // Allow PostgreSQL traffic from application security group only
    this.databaseSecurityGroup.addIngressRule(
      this.applicationSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from application tier'
    );

    // Tag resources
    cdk.Tags.of(this.vpc).add('Environment', 'production');
    cdk.Tags.of(this.vpc).add('MigrationProject', '2024Q1');
    cdk.Tags.of(this.databaseSecurityGroup).add('Environment', 'production');
    cdk.Tags.of(this.databaseSecurityGroup).add('MigrationProject', '2024Q1');
    cdk.Tags.of(this.applicationSecurityGroup).add('Environment', 'production');
    cdk.Tags.of(this.applicationSecurityGroup).add(
      'MigrationProject',
      '2024Q1'
    );
  }
}

```

---

## lib/tap-stack.ts
**Path:** `lib/tap-stack.ts`

```ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkConstruct } from './constructs/network-construct';
import { DatabaseConstruct } from './constructs/database-construct';
import { DmsConstruct } from './constructs/dms-construct';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create network infrastructure
    const network = new NetworkConstruct(this, 'Network', {
      environmentSuffix,
    });

    // Create Aurora PostgreSQL database
    const database = new DatabaseConstruct(this, 'Database', {
      environmentSuffix,
      vpc: network.vpc,
      securityGroup: network.databaseSecurityGroup,
    });

    // Source database configuration (placeholder values for on-premises database)
    // In production, these should come from SSM Parameter Store or Secrets Manager
    const sourceHost =
      this.node.tryGetContext('sourceHost') || 'onprem-db.example.com';
    const sourcePort = this.node.tryGetContext('sourcePort') || 5432;
    const sourceDatabase =
      this.node.tryGetContext('sourceDatabase') || 'postgres';
    const sourceUsername =
      this.node.tryGetContext('sourceUsername') || 'postgres';
    const sourcePassword =
      this.node.tryGetContext('sourcePassword') || 'changeme';

    // Create DMS infrastructure
    const dms = new DmsConstruct(this, 'DMS', {
      environmentSuffix,
      vpc: network.vpc,
      securityGroup: network.applicationSecurityGroup,
      targetEndpoint: database.clusterEndpoint,
      targetEndpointHostname: database.clusterEndpointHostname,
      targetEndpointPort: database.clusterEndpointPort,
      targetSecret: database.secret,
      sourceHost,
      sourcePort,
      sourceDatabase,
      sourceUsername,
      sourcePassword,
    });

    // Ensure DMS is created after database is ready
    dms.node.addDependency(database);

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'AuroraClusterEndpoint', {
      description: 'Aurora PostgreSQL cluster endpoint',
      value: database.clusterEndpoint,
      exportName: `aurora-cluster-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AuroraReaderEndpoint', {
      description: 'Aurora PostgreSQL reader endpoint',
      value: database.readerEndpoint,
      exportName: `aurora-reader-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      description: 'ARN of the database credentials secret',
      value: database.secret.secretArn,
      exportName: `database-secret-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DMSTaskArn', {
      description: 'ARN of the DMS migration task',
      value: dms.taskArn,
      exportName: `dms-task-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VPCId', {
      description: 'VPC ID',
      value: network.vpc.vpcId,
      exportName: `vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecurityGroupId', {
      description: 'Database security group ID',
      value: network.databaseSecurityGroup.securityGroupId,
      exportName: `database-sg-id-${environmentSuffix}`,
    });
  }
}

```

---

_Note: Only `.ts` files are included; Terraform and documentation files remain excluded._
