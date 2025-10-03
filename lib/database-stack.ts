import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface DatabaseStackProps {
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
  backupBucket: s3.Bucket;
  environmentSuffix: string;
}

export class DatabaseStack extends Construct {
  public readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);

    // Get the current region for region-specific configuration
    const region = cdk.Stack.of(this).region;

    // Define database engine and version based on region support
    // us-east-1 has full PostgreSQL support with modern versions available
    const getDatabaseEngine = (region: string): rds.IInstanceEngine => {
      if (region === 'us-east-1') {
        // us-east-1 has full PostgreSQL support
        return rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15_4,
        });
      } else {
        // Other regions may have limited support, use stable PostgreSQL version
        return rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_13_7,
        });
      }
    };

    const databaseEngine = getDatabaseEngine(region);
    const isPostgres = true; // Use PostgreSQL for all regions now

    // Output the selected database engine for debugging
    new cdk.CfnOutput(this, 'DatabaseEngineUsed', {
      value: `Database engine selected for region ${region}: PostgreSQL ${region === 'us-east-1' ? '15.4' : '13.7'}`,
      description:
        'Database engine automatically selected based on region compatibility',
    });

    // Create KMS key for database encryption
    const encryptionKey = new kms.Key(this, 'DatabaseEncryptionKey', {
      description: 'KMS key for RDS database encryption',
      enableKeyRotation: true,
      alias: `retail-db-key-${props.environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Must be destroyable for testing
    });

    // Create database credentials secret
    const databaseCredentials = new secretsmanager.Secret(
      this,
      'DatabaseCredentials',
      {
        description: 'RDS PostgreSQL database credentials',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
          generateStringKey: 'password',
          excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
          passwordLength: 32,
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Must be destroyable for testing
      }
    );

    // Create subnet group
    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      description: 'Subnet group for RDS PostgreSQL',
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Must be destroyable for testing
    });

    // Create RDS PostgreSQL instance
    this.database = new rds.DatabaseInstance(this, 'RetailDatabase', {
      instanceIdentifier: `retail-db-${props.environmentSuffix}`,
      engine: databaseEngine,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc: props.vpc,
      subnetGroup: subnetGroup,
      securityGroups: [props.securityGroup],
      credentials: rds.Credentials.fromSecret(databaseCredentials),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      storageEncryptionKey: encryptionKey,
      multiAz: false,
      autoMinorVersionUpgrade: true,
      backupRetention: cdk.Duration.days(7),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: false, // Disabled for testing - must be destroyable
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Must be destroyable for testing
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      performanceInsightEncryptionKey: encryptionKey,
      monitoringInterval: cdk.Duration.seconds(60),
      databaseName: 'retaildb',
      parameterGroup: new rds.ParameterGroup(this, 'ParameterGroup', {
        engine: databaseEngine,
        parameters: {
          // PostgreSQL parameters - optimized for us-east-1
          log_statement: 'all',
          log_duration: 'on',
          shared_preload_libraries: 'pg_stat_statements',
          max_connections: '100',
          shared_buffers: '256MB',
        },
      }),
    });

    // Note: RDS automatic backups are handled by AWS internally
    // The S3 bucket is for additional manual backups if needed

    // Output database endpoint
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.dbInstanceEndpointAddress,
      description: 'RDS database endpoint',
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: this.database.dbInstanceEndpointPort,
      description: 'RDS database port',
    });

    // Tag resources
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Application', 'RetailDatabase');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
