import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
}

export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // KMS key for RDS encryption
    const rdsKmsKey = new kms.Key(this, 'RDSKMSKey', {
      description: 'KMS Key for RDS encryption',
      enableKeyRotation: true,
    });

    // DB Subnet Group for RDS
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      vpc: props.vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Parameter Group for MySQL
    const parameterGroup = new rds.ParameterGroup(this, 'DBParameterGroup', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_35,
      }),
      description: 'Parameter group for MySQL database',
      parameters: {
        slow_query_log: '1',
        log_queries_not_using_indexes: '1',
        innodb_buffer_pool_size: '{DBInstanceClassMemory*3/4}',
      },
    });

    // RDS Database Instance with Multi-AZ and encryption
    this.database = new rds.DatabaseInstance(this, 'SecureDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_35,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [props.securityGroup],
      subnetGroup: dbSubnetGroup,
      parameterGroup: parameterGroup,

      // High Availability and Security Configuration
      multiAz: true,
      storageEncrypted: true,
      storageEncryptionKey: rdsKmsKey,

      // Database Configuration
      databaseName: 'appdb',
      credentials: rds.Credentials.fromGeneratedSecret('admin'),

      // Storage Configuration
      allocatedStorage: 100,
      maxAllocatedStorage: 1000,
      storageType: rds.StorageType.GP3,

      // Backup Configuration
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: false,
      deletionProtection: true,

      // Monitoring
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,

      // Maintenance
      autoMinorVersionUpgrade: true,
      allowMajorVersionUpgrade: false,

      // Logging
      cloudwatchLogsExports: ['error', 'general', 'slow-query'],
    });

    // Output database endpoint
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: this.database.instanceEndpoint.port.toString(),
      description: 'RDS Database Port',
    });
  }
}
