import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
// import * as logs from 'aws-cdk-lib/aws-logs'; // Not needed
import { Construct } from 'constructs';

interface RdsStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  databaseSg: ec2.SecurityGroup;
  environmentSuffix: string;
}

export class RdsStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: RdsStackProps) {
    super(scope, id, props);

    // KMS key for RDS encryption
    const rdsKey = new kms.Key(this, 'RdsEncryptionKey', {
      description: 'KMS key for RDS encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // DB subnet group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc: props.vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Parameter group for enhanced performance and security
    const parameterGroup = new rds.ParameterGroup(
      this,
      'DatabaseParameterGroup',
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        parameters: {
          innodb_buffer_pool_size: '{DBInstanceClassMemory*3/4}',
          slow_query_log: '1',
          long_query_time: '2',
          log_queries_not_using_indexes: '1',
        },
      }
    );

    // RDS instance with high availability
    this.database = new rds.DatabaseInstance(this, 'SecureDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!@\\/\"=^',
      }),
      vpc: props.vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [props.databaseSg],

      // Storage configuration
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      storageEncryptionKey: rdsKey,

      // Backup and maintenance
      backupRetention: cdk.Duration.days(7),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deleteAutomatedBackups: false,
      deletionProtection: false, // Set to true for production

      // Multi-AZ for high availability
      multiAz: true,

      // Monitoring and logging
      monitoringInterval: cdk.Duration.seconds(0), // Disable enhanced monitoring for cost
      enablePerformanceInsights: false,
      cloudwatchLogsExports: ['error', 'general', 'slowquery'],

      // Parameter group
      parameterGroup: parameterGroup,

      // Enhanced monitoring role will be created automatically
      autoMinorVersionUpgrade: true,

      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create a read replica for read scaling
    new rds.DatabaseInstanceReadReplica(this, 'ReadReplica', {
      sourceDatabaseInstance: this.database,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc: props.vpc,
      securityGroups: [props.databaseSg],
      deleteAutomatedBackups: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
