import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { StackConfig } from '../interfaces/config-interfaces';
import { NamingUtil } from '../utils/naming';

interface DatabaseConstructProps extends StackConfig {
  vpc: ec2.Vpc;
}

export class DatabaseConstruct extends Construct {
  public readonly databaseSecret: secretsmanager.Secret;
  public readonly databaseEndpoint: string;
  public readonly dbInstance: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    const { config, vpc } = props;

    // Create database credentials in Secrets Manager (fix: single secret approach)
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: NamingUtil.generateSecretName(config, 'rds-postgres'),
      description: 'PostgreSQL database master credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'dbadmin',
          engine: 'postgres',
          port: 5432,
          dbname: 'maindb',
        }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
        includeSpace: false,
      },
    });

    // Create security group for RDS with least privilege
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc,
        securityGroupName: NamingUtil.generateResourceName(
          config,
          'rds-sg',
          false
        ),
        description: 'Security group for PostgreSQL RDS instance',
        allowAllOutbound: false,
      }
    );

    // Only allow connections from private subnets on PostgreSQL port
    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from VPC private subnets'
    );

    // Create subnet group for database
    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      subnetGroupName: NamingUtil.generateResourceName(
        config,
        'rds-subnet-group',
        false
      ),
      description: 'Subnet group for PostgreSQL RDS instance',
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create parameter group for PostgreSQL optimization
    const parameterGroup = new rds.ParameterGroup(
      this,
      'DatabaseParameterGroup',
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15,
        }),
        description: 'PostgreSQL parameter group with optimized settings',
        parameters: {
          shared_preload_libraries: 'pg_stat_statements',
          log_statement: 'all',
          log_min_duration_statement: '1000', // Log queries longer than 1 second
          log_checkpoints: '1',
          log_connections: '1',
          log_disconnections: '1',
        },
      }
    );

    // Create PostgreSQL instance with all requirements
    this.dbInstance = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: NamingUtil.generateResourceName(
        config,
        'postgres',
        false
      ),
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        config.environment === 'prod'
          ? ec2.InstanceSize.LARGE
          : ec2.InstanceSize.MICRO
      ),
      vpc,
      subnetGroup,
      securityGroups: [dbSecurityGroup],
      parameterGroup,

      // Storage configuration with encryption (requirement)
      allocatedStorage: config.environment === 'prod' ? 100 : 20,
      maxAllocatedStorage: config.environment === 'prod' ? 1000 : 100,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true, // Requirement: encrypted storage

      // Credentials from Secrets Manager (requirement)
      credentials: rds.Credentials.fromSecret(this.databaseSecret),

      // High availability and backup
      multiAz: config.environment === 'prod',
      backupRetention: cdk.Duration.days(
        config.environment === 'prod' ? 30 : 7
      ),

      // Deletion protection (set to false for automation as requested)
      deletionProtection: false,

      // Performance and monitoring
      enablePerformanceInsights: config.environment === 'prod',
      performanceInsightRetention:
        config.environment === 'prod'
          ? rds.PerformanceInsightRetention.LONG_TERM
          : undefined,

      // Logging
      cloudwatchLogsExports: ['postgresql'],

      // Maintenance and updates
      autoMinorVersionUpgrade: false, // Controlled updates
      preferredMaintenanceWindow: 'sun:03:00-sun:04:00',
      preferredBackupWindow: '02:00-03:00',

      // Security
      publiclyAccessible: false,

      // Lifecycle
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow destroy for automation
    });

    this.databaseEndpoint = this.dbInstance.dbInstanceEndpointAddress;

    // Create read replica for production
    if (config.environment === 'prod') {
      new rds.DatabaseInstanceReadReplica(this, 'DatabaseReadReplica', {
        sourceDatabaseInstance: this.dbInstance,
        instanceIdentifier: NamingUtil.generateResourceName(
          config,
          'postgres-replica',
          false
        ),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T4G,
          ec2.InstanceSize.MEDIUM
        ),
        vpc,
        subnetGroup,
        securityGroups: [dbSecurityGroup],
        publiclyAccessible: false,
        deletionProtection: false,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
    }

    // Apply tags
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.dbInstance).add(
      'Name',
      NamingUtil.generateResourceName(config, 'postgres', false)
    );
  }
}
